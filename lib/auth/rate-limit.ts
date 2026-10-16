export type LoginAttempt = { count: number; windowStartedAt: number; blockedUntil: number | null };
export function nextLoginAttempt(previous: LoginAttempt | null, now = Date.now(), success = false): LoginAttempt {
  if (success) return { count: 0, windowStartedAt: now, blockedUntil: null };
  const current = !previous || now - previous.windowStartedAt > 15 * 60_000 ? { count: 0, windowStartedAt: now, blockedUntil: null } : previous;
  const count = current.count + 1;
  return { count, windowStartedAt: current.windowStartedAt, blockedUntil: count >= 5 ? now + 15 * 60_000 : null };
}
