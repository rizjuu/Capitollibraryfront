import { AnimatePresence, motion } from "framer-motion";
import { ScanBarcode, CheckCircle2, X, Wifi } from "lucide-react";

export default function BarcodeScannerIndicator({
  isScannerConnected = true,
  showConnectPopup = false,
  onDismissPopup = () => {},
  lastScanned = null,
}) {
  return (
    <>
      {/* 1. Small System Pop-Up notification for Barcode Scanner Connection */}
      <AnimatePresence>
        {showConnectPopup && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: "28px",
              right: "28px",
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(12px)",
              color: "#ffffff",
              padding: "14px 18px",
              borderRadius: "14px",
              boxShadow: "0 14px 34px -4px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              maxWidth: "380px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.18)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                flexShrink: 0,
              }}
            >
              <ScanBarcode size={22} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc" }}>
                  Barcode Scanner Connected
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  margin: "3px 0 0",
                  lineHeight: 1.35,
                }}
              >
                USB / Wireless scanner active. Point & scan any book in the catalog.
              </p>
            </div>

            <button
              type="button"
              onClick={onDismissPopup}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Notification when a book barcode was just scanned */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            key={lastScanned.time?.getTime() || lastScanned.code}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "fixed",
              top: "24px",
              right: "28px",
              zIndex: 9998,
              background: "#10b981",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "30px",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <CheckCircle2 size={18} />
            <span>Scanned: <code style={{ fontFamily: "monospace", background: "rgba(0,0,0,0.18)", padding: "2px 7px", borderRadius: "5px" }}>{lastScanned.code}</code></span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Status pill to display in page headers or next to search inputs
 */
export function BarcodeScannerBadge({ isConnected = true, label = "Scanner Ready" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        background: isConnected ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
        border: `1px solid ${isConnected ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
        color: isConnected ? "#059669" : "#dc2626",
        padding: "5px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "0.2px",
      }}
      title="USB / Bluetooth handheld barcode scanner detection"
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: isConnected ? "#10b981" : "#ef4444",
          boxShadow: isConnected ? "0 0 6px #10b981" : "none",
        }}
      />
      <ScanBarcode size={14} />
      <span>{label}</span>
    </div>
  );
}
