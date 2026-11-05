/**
 * Patron Utilities for Capitol Library
 * Patron ID Format: MISORLIB-YYYY-XXX (e.g. MISORLIB-2026-001)
 */

export function formatPatronId(user) {
  if (!user) return "MISORLIB-2026-001";
  
  if (user.patronId && user.patronId.toUpperCase().startsWith("MISORLIB-")) {
    return user.patronId.toUpperCase();
  }
  if (user.username && user.username.toUpperCase().startsWith("MISORLIB-")) {
    return user.username.toUpperCase();
  }
  
  const year = user.createdAt || user.created_at
    ? new Date(user.createdAt || user.created_at).getFullYear()
    : 2026;

  const idSeed = String(user.id || user._id || "");
  const numPart = idSeed.replace(/[^\d]/g, "").slice(-3) || "001";
  return `MISORLIB-${year}-${numPart.padStart(3, "0")}`;
}
