const iterations = 210_000;
const bytes = (s: string) => new TextEncoder().encode(s);
const b64 = (a: Uint8Array) => Buffer.from(a).toString("base64url");
export const validatePassword = (password: string) => password.length >= 10 && password.length <= 128;
export async function hashPassword(password: string): Promise<string> {
  if (!validatePassword(password)) throw new Error("Password must be 10-128 characters");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", bytes(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
  return `pbkdf2-sha256$${iterations}$${b64(salt)}$${b64(hash)}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    const parts = encoded.split("$");
    if (parts.length !== 4) return false;
    const [kind, count, saltText, expectedText] = parts;
    if (kind !== "pbkdf2-sha256" || count !== String(iterations) || !saltText || !expectedText) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(expectedText, "base64url");
    if (salt.length !== 16 || expected.length !== 32 || b64(salt) !== saltText || b64(expected) !== expectedText) return false;
    const key = await crypto.subtle.importKey("raw", bytes(password), "PBKDF2", false, ["deriveBits"]);
    const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
    let diff = 0; for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expected[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}
