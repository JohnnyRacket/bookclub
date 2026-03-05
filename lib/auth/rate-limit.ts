/**
 * In-memory PIN attempt tracker.
 * Sufficient for single-server self-hosted deployment.
 * 5 attempts max, 15-minute lockout window.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

function key(name: string): string {
  return name.toLowerCase();
}

export function checkRateLimit(name: string): {
  allowed: boolean;
  attemptsLeft: number;
  lockedUntilMs: number | null;
} {
  const record = attempts.get(key(name));
  if (!record) return { allowed: true, attemptsLeft: MAX_ATTEMPTS, lockedUntilMs: null };

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return { allowed: false, attemptsLeft: 0, lockedUntilMs: record.lockedUntil };
  }

  if (record.count >= MAX_ATTEMPTS) {
    // Lock them out
    const lockedUntil = Date.now() + WINDOW_MS;
    attempts.set(key(name), { count: record.count, lockedUntil });
    return { allowed: false, attemptsLeft: 0, lockedUntilMs: lockedUntil };
  }

  return { allowed: true, attemptsLeft: MAX_ATTEMPTS - record.count, lockedUntilMs: null };
}

export function recordFailedAttempt(name: string): number {
  const record = attempts.get(key(name)) ?? { count: 0, lockedUntil: null };
  const newCount = record.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + WINDOW_MS : record.lockedUntil;
  attempts.set(key(name), { count: newCount, lockedUntil });
  return Math.max(0, MAX_ATTEMPTS - newCount);
}

export function clearAttempts(name: string): void {
  attempts.delete(key(name));
}
