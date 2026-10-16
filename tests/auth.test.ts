import test from "node:test";
import assert from "node:assert/strict";
import { validatePassword, hashPassword, verifyPassword } from "@/lib/auth/password";
import { enforceAuthSecret } from "@/lib/auth/session";
import { loginAttemptKeys, nextLoginAttempt, retryAfterSeconds } from "@/lib/auth/login-attempts";
import { assignableWorkScopes } from "@/lib/auth/access";

test("password policy is at least 10 characters", async () => {
  assert.equal(validatePassword("short"), false);
  assert.equal(validatePassword("long-enough"), true);
  const encoded = await hashPassword("long-enough");
  assert.equal(await verifyPassword("long-enough", encoded), true);
  assert.equal(await verifyPassword("not-correct", encoded), false);
});
test("production auth secret fails closed", () => {
  assert.throws(() => enforceAuthSecret(undefined, true));
  assert.throws(() => enforceAuthSecret("too-short", true));
  assert.equal(enforceAuthSecret("x".repeat(32), true), "x".repeat(32));
});

test("login rate limits use independent hashed account and IP keys", async () => {
  const first = await loginAttemptKeys(" Alice ", "203.0.113.4");
  const otherIp = await loginAttemptKeys("alice", "203.0.113.5");
  const otherAccount = await loginAttemptKeys("bob", "203.0.113.4");
  assert.equal(first.account, otherIp.account);
  assert.notEqual(first.ip, otherIp.ip);
  assert.equal(first.ip, otherAccount.ip);
  assert.notEqual(first.account, otherAccount.account);
  assert.doesNotMatch(first.account, /alice/i);
  assert.doesNotMatch(first.ip, /203\.0\.113\.4/);
});

test("account and IP counters apply their own limits and retry timing", () => {
  const now = 1_000_000;
  assert.equal(nextLoginAttempt({ count: 4, windowStartedAt: now - 1_000, blockedUntil: null }, now, 5).blockedUntil, now + 900_000);
  assert.equal(nextLoginAttempt({ count: 29, windowStartedAt: now - 1_000, blockedUntil: null }, now, 30).blockedUntil, now + 900_000);
  assert.deepEqual(nextLoginAttempt({ count: 30, windowStartedAt: 0, blockedUntil: 500 }, now, 30), { count: 1, windowStartedAt: now, blockedUntil: null });
  assert.equal(retryAfterSeconds(now + 1_501, now), 2);
});

test("PBKDF2 verification rejects unsupported or malformed iteration fields", async () => {
  const encoded = await hashPassword("long-enough");
  assert.equal(await verifyPassword("long-enough", encoded.replace("$210000$", "$210001$")), false);
  assert.equal(await verifyPassword("long-enough", encoded.replace("$210000$", "$not-a-number$")), false);
  assert.equal(await verifyPassword("long-enough", `${encoded}$extra`), false);
});

test("only SystemAdmin may assign sensitive scopes", () => {
  assert.deepEqual(assignableWorkScopes("UnitAdmin", ["stock", "sensitive:patients"]), ["stock"]);
  assert.deepEqual(assignableWorkScopes("SystemAdmin", ["stock", "sensitive:patients"]), ["stock", "sensitive:patients"]);
});
