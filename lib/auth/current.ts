import { cookies } from "next/headers";
import { database } from "@/lib/db";
import { enforceAuthSecret, readSession, type Session } from "./session";
export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get("fc_session")?.value;
  if (!token) return null;
  try {
    const session = await readSession(token, enforceAuthSecret(process.env.AUTH_SECRET));
    const db = await database();
    const user = await db.prepare("SELECT active, session_version FROM users WHERE id = ?").bind(session.userId).first<{active:number;session_version:number}>();
    if (!user?.active || user.session_version !== session.sessionVersion) return null;
    if (session.jti) { const revoked = await db.prepare("SELECT jti FROM revoked_sessions WHERE jti = ?").bind(session.jti).first(); if (revoked) return null; }
    return session;
  } catch { return null; }
}
export function requireRole(session: Session | null, roles: Session["role"][]) { if (!session || !roles.includes(session.role)) throw new Error("FORBIDDEN"); return session; }
