import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Play a subtle, pleasant scanner confirmation beep using Web Audio API.
 */
export function playScannerBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1850, ctx.currentTime); // 1850 Hz high-pitch chime
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    // AudioContext might be blocked until user interacts, safely ignore
  }
}

/**
 * Custom hook to detect USB / Bluetooth handheld barcode scanner keystrokes
 * and monitor scanner connection status.
 */
export function useBarcodeScanner({ onScan, enabled = true }) {
  const [isScannerConnected, setIsScannerConnected] = useState(true);
  const [lastScanned, setLastScanned] = useState(null);
  const [showConnectPopup, setShowConnectPopup] = useState(false);

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  // Initial small pop-up on mount to notify staff the scanner listener is active
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConnectPopup(true);
      const dismissTimer = setTimeout(() => setShowConnectPopup(false), 5000);
      return () => clearTimeout(dismissTimer);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  // WebHID device connection listeners if supported by browser
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.hid) {
      const handleConnect = () => {
        setIsScannerConnected(true);
        setShowConnectPopup(true);
        setTimeout(() => setShowConnectPopup(false), 4500);
      };

      const handleDisconnect = () => {
        setIsScannerConnected(false);
      };

      navigator.hid.addEventListener("connect", handleConnect);
      navigator.hid.addEventListener("disconnect", handleDisconnect);

      return () => {
        navigator.hid.removeEventListener("connect", handleConnect);
        navigator.hid.removeEventListener("disconnect", handleDisconnect);
      };
    }
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      const now = performance.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter marks the end of a barcode scan
      if (e.key === "Enter") {
        const scannedText = bufferRef.current.trim();
        bufferRef.current = "";
        clearTimeout(timeoutRef.current);

        // Hardware scanners output characters with very low latency (< 50ms average)
        if (scannedText.length >= 3) {
          playScannerBeep();
          setLastScanned({ code: scannedText, time: new Date() });
          setIsScannerConnected(true);

          if (onScan) {
            onScan(scannedText);
          }
        }
        return;
      }

      // Ignore non-character keys (Shift, Ctrl, Alt, CapsLock, Tab, etc.)
      if (e.key.length > 1) {
        return;
      }

      // If more than 120ms passed between keys, it's likely a slow human typing rather than scanner burst
      if (elapsed > 120 && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      bufferRef.current += e.key;

      // Auto-clear buffer after 300ms of inactivity
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 300);
    },
    [enabled, onScan]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);

  const dismissPopup = () => setShowConnectPopup(false);

  return {
    isScannerConnected,
    lastScanned,
    showConnectPopup,
    dismissPopup,
  };
}
