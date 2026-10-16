import { SignJWT, jwtVerify } from "jose";
export type Role = "SystemAdmin" | "UnitAdmin" | "Staff";
export type Session = { userId: string; username: string; displayName?: string; role: Role; unitId: string | null; workScopes: string[]; sessionVersion: number };
export function enforceAuthSecret(value: string | undefined, production = process.env.NODE_ENV === "production"): string {
  if (production && (!value || value.length < 32)) throw new Error("AUTH_SECRET must contain at least 32 characters in production");
  return value && value.length >= 32 ? value : "local-development-only-secret-32-bytes";
}
export async function issueSession(session: Session, secret: string) {
  return new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").setJti(crypto.randomUUID()).sign(new TextEncoder().encode(secret));
}
export async function readSession(token: string, secret: string): Promise<Session & { jti?: string }> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload as unknown as Session & { jti?: string };
}
