type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt < now) {
    const next: Bucket = {
      count: 1,
      resetAt: now + windowMs
    };
    store.set(key, next);
    return { allowed: true, remaining: max - 1, resetAt: next.resetAt };
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  store.set(key, bucket);
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}
