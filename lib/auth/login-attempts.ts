export const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
export const ACCOUNT_LOGIN_LIMIT = 5;
export const IP_LOGIN_LIMIT = 30;

export type LoginAttempt = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number | null;
};

const digest = async (value: string) => Buffer.from(
  await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
).toString("hex");

export const normalizeLoginUsername = (username: string) => username.trim().toLowerCase();

export async function loginAttemptKeys(username: string, ip: string) {
  return {
    account: await digest(`account:${normalizeLoginUsername(username)}`),
    ip: await digest(`ip:${ip}`),
  };
}

export function nextLoginAttempt(attempt: LoginAttempt | null, now: number, limit: number): LoginAttempt {
  const inWindow = attempt !== null && now - attempt.windowStartedAt < LOGIN_WINDOW_MS;
  const count = inWindow ? attempt.count + 1 : 1;
  return {
    count,
    windowStartedAt: inWindow ? attempt.windowStartedAt : now,
    blockedUntil: count >= limit ? now + LOGIN_WINDOW_MS : null,
  };
}

export const retryAfterSeconds = (blockedUntil: number, now: number) => Math.max(1, Math.ceil((blockedUntil - now) / 1_000));
