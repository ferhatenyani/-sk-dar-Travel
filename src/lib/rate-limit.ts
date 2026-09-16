/**
 * Rate-limit simple en mémoire (sans dépendance). Suffisant pour le
 * squelette ; sur serverless la limite est par instance.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Retourne true si la requête est autorisée, false si la limite est atteinte. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIpFrom(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "local"
  );
}
