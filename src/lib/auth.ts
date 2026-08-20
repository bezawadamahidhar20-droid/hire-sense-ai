import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE = "hiresense_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "candidate" | "recruiter";
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(sessions).values({
    id: token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  const store = await cookies();
  // Mark the cookie secure only when the request actually arrived over HTTPS
  // (via x-forwarded-proto). Tying this to NODE_ENV silently drops the cookie
  // on plain-HTTP hosts that set NODE_ENV=production, logging users back out.
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  const secure = forwardedProto?.split(",")[0]?.trim() === "https";
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
