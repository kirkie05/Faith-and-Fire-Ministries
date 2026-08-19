/**
 * Redirect URL policy used by payment flows.
 *
 * Open redirects let attackers weaponize payment callbacks ("payment made,
 * now visit attacker.site") or leak tokens via Referer. Only app-owned
 * origins may be used as redirect targets; everything else is rejected.
 */

export const APP_ORIGINS = [
  "https://faithandfireministries.co.za",
  "http://localhost:3000",
  "http://localhost:4173",
] as const;

export function isAllowedRedirectUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  if (raw.length > 500) return false;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  return (APP_ORIGINS as readonly string[]).includes(parsed.origin);
}

/**
 * Returns `raw` when it is an allowed app origin, otherwise the `fallback`
 * origin. Never throws.
 */
export function sanitizeRedirectUrl(
  raw: string | null | undefined,
  fallback: string = "https://faithandfireministries.co.za"
): string {
  return isAllowedRedirectUrl(raw) ? (raw as string) : fallback;
}