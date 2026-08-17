import "server-only";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { and, count, gte, lt, min, eq } from "drizzle-orm";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_EMAIL_ATTEMPTS = 5;
const MAX_IP_ATTEMPTS = 20;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

export async function checkLoginRateLimit(
  email: string,
  ip?: string
): Promise<RateLimitResult> {
  try {
    const since = windowStart();

    const emailRows = await db
      .select({ total: count(), oldest: min(loginAttempts.attemptedAt) })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.email, email), gte(loginAttempts.attemptedAt, since)));

    const emailTotal = emailRows[0]?.total ?? 0;
    if (emailTotal >= MAX_EMAIL_ATTEMPTS) {
      return { allowed: false, retryAfterMs: retryAfter(emailRows[0]?.oldest) };
    }

    if (ip) {
      const ipRows = await db
        .select({ total: count(), oldest: min(loginAttempts.attemptedAt) })
        .from(loginAttempts)
        .where(and(eq(loginAttempts.ip, ip), gte(loginAttempts.attemptedAt, since)));

      const ipTotal = ipRows[0]?.total ?? 0;
      if (ipTotal >= MAX_IP_ATTEMPTS) {
        return { allowed: false, retryAfterMs: retryAfter(ipRows[0]?.oldest) };
      }
    }

    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    console.error("checkLoginRateLimit failed (failing open):", err);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export async function recordFailedLogin(email: string, ip?: string): Promise<void> {
  try {
    await db
      .delete(loginAttempts)
      .where(lt(loginAttempts.attemptedAt, windowStart()));
    await db.insert(loginAttempts).values({ email, ip: ip ?? null });
  } catch (err) {
    console.error("recordFailedLogin failed:", err);
  }
}

export async function clearLoginAttempts(email: string): Promise<void> {
  try {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
  } catch (err) {
    console.error("clearLoginAttempts failed:", err);
  }
}

function retryAfter(oldest: Date | string | null | undefined): number {
  if (!oldest) return WINDOW_MS;
  const end = new Date(oldest).getTime() + WINDOW_MS;
  return Math.max(0, end - Date.now());
}

export function formatRetryMinutes(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`;
}
