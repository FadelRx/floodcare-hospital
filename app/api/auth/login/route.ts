import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { enforceAuthSecret, issueSession, type Role } from "@/lib/auth/session";
import { hospitalConfig } from "@/lib/config/runtime";
import { normalizeWorkScopes } from "@/lib/auth/access";
import { readJsonBody } from "@/lib/http";
import { ACCOUNT_LOGIN_LIMIT, IP_LOGIN_LIMIT, loginAttemptKeys, nextLoginAttempt, normalizeLoginUsername, retryAfterSeconds, type LoginAttempt } from "@/lib/auth/login-attempts";

type StoredAttempt = { count: number; window_started_at: number; blocked_until: number | null };
type StoredUser = { id:string; username:string; display_name:string; password_hash:string; role:Role; unit_id:string|null; work_scopes_json:string; active:number; session_version:number };
const genericMessage = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
const DUMMY_PASSWORD_HASH = "pbkdf2-sha256$210000$LuMH5qUN3wyUF-Puxww9MA$VhGM-6fqpG5uPxb8J9lGS5vg3qRryoKq-0-E4X5ULsA";
const generic = (status = 401, headers?: Record<string, string>) => NextResponse.json({ error: genericMessage }, { status, headers });
const toAttempt = (row: StoredAttempt | null): LoginAttempt | null => row && ({ count: row.count, windowStartedAt: row.window_started_at, blockedUntil: row.blocked_until });

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await readJsonBody(request, 1_024); } catch { return generic(); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return generic();
  const input = body as Record<string, unknown>;
  if (typeof input.username !== "string" || typeof input.password !== "string" || input.username.length > 100) return generic();
  try {
    const db = await database(), now = Date.now(), username = normalizeLoginUsername(input.username);
    const keys = await loginAttemptKeys(username, request.headers.get("cf-connecting-ip") ?? "unknown");
    const accountRow = await db.prepare("SELECT count, window_started_at, blocked_until FROM login_attempts WHERE key_hash = ?").bind(keys.account).first<StoredAttempt>();
    const ipRow = await db.prepare("SELECT count, window_started_at, blocked_until FROM login_attempts WHERE key_hash = ?").bind(keys.ip).first<StoredAttempt>();
    const blockedUntil = Math.max(accountRow?.blocked_until ?? 0, ipRow?.blocked_until ?? 0);
    if (blockedUntil > now) return generic(429, { "Retry-After": String(retryAfterSeconds(blockedUntil, now)) });
    const user = await db.prepare("SELECT id, username, display_name, password_hash, role, unit_id, work_scopes_json, active, session_version FROM users WHERE hospital_id = ? AND username = ? COLLATE NOCASE").bind(hospitalConfig.identity.id, username).first<StoredUser>();
    const passwordMatches = await verifyPassword(input.password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
    const valid = !!user?.active && passwordMatches;
    if (!valid) {
      const account = nextLoginAttempt(toAttempt(accountRow), now, ACCOUNT_LOGIN_LIMIT), ip = nextLoginAttempt(toAttempt(ipRow), now, IP_LOGIN_LIMIT);
      const upsert = "INSERT INTO login_attempts(key_hash,count,window_started_at,blocked_until) VALUES(?,?,?,?) ON CONFLICT(key_hash) DO UPDATE SET count=excluded.count,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until";
      await db.batch([db.prepare(upsert).bind(keys.account, account.count, account.windowStartedAt, account.blockedUntil), db.prepare(upsert).bind(keys.ip, ip.count, ip.windowStartedAt, ip.blockedUntil)]);
      return generic();
    }
    await db.prepare("DELETE FROM login_attempts WHERE key_hash = ?").bind(keys.account).run();
    let storedScopes: unknown = []; try { storedScopes = JSON.parse(user.work_scopes_json); } catch {}
    const token = await issueSession({ userId:user.id, username:user.username, displayName:user.display_name, role:user.role, unitId:user.unit_id, workScopes:normalizeWorkScopes(storedScopes), sessionVersion:user.session_version }, enforceAuthSecret(process.env.AUTH_SECRET));
    const response = NextResponse.json({ ok:true }); response.cookies.set("fc_session", token, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:43200 }); return response;
  } catch { return NextResponse.json({ error:"ระบบยืนยันตัวตนไม่พร้อมใช้งาน" }, { status:503 }); }
}
