/**
 * Normalise un numéro de téléphone burkinabè sur 8 chiffres significatifs.
 * Supprime les espaces, tirets, parenthèses et l'indicatif +226 / 00226.
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  // Supprime indicatif international
  s = s.replace(/^\+226/, "").replace(/^00226/, "");
  // Supprime tous les caractères non numériques
  s = s.replace(/\D/g, "");
  // Garde les 8 derniers chiffres significatifs
  if (s.length > 8) s = s.slice(-8);
  return s;
}

export function isValidPhone(normalized: string): boolean {
  return /^\d{8}$/.test(normalized);
}

export function formatPhoneDisplay(normalized: string): string {
  if (!normalized || normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 8)}`;
}
