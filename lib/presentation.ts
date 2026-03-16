export function sanitizeDisplayText(value: string) {
  return value
    .replace(/\bDemo\b/gi, "")
    .replace(/\.demo(?=@)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeDisplayName(value: string) {
  return sanitizeDisplayText(value);
}

export function sanitizeDisplayEmail(value: string) {
  return sanitizeDisplayText(value);
}
