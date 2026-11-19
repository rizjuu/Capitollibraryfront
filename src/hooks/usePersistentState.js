import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for automatic form and filter persistence across page navigation.
 * Stores drafted inputs in sessionStorage so patrons can switch tabs or navigate
 * without losing what they typed, and clears the draft when submitted.
 *
 * @param {string} key - Unique storage identifier
 * @param {any} initialValue - Fallback initial state
 * @returns {[any, Function, Function, boolean]} [state, setState, clearState, isDraftSaved]
 */
export function usePersistentState(key, initialValue) {
  const fullKey = `mopl_patron_draft_${key}`;

  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(fullKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (
          typeof initialValue === "object" &&
          initialValue !== null &&
          !Array.isArray(initialValue) &&
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return { ...initialValue, ...parsed };
        }
        return parsed;
      }
    } catch (e) {
      console.warn(`[usePersistentState] Error loading "${fullKey}":`, e);
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  const [isDraftSaved, setIsDraftSaved] = useState(() => {
    try {
      return sessionStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  });

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        if (state === undefined || state === null) {
          sessionStorage.removeItem(fullKey);
          setIsDraftSaved(false);
        } else {
          sessionStorage.setItem(fullKey, JSON.stringify(state));
          setIsDraftSaved(true);
        }
      } catch (e) {
        console.warn(`[usePersistentState] Error saving "${fullKey}":`, e);
      }
    }, 150);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fullKey, state]);

  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(fullKey);
    } catch (e) {}
    setIsDraftSaved(false);
    setState(typeof initialValue === "function" ? initialValue() : initialValue);
  }, [fullKey, initialValue]);

  return [state, setState, clearState, isDraftSaved];
}

export default usePersistentState;
