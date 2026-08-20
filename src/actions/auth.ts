"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  formatRetryMinutes,
  recordFailedLogin,
} from "@/lib/rateLimit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type AuthFormState = {
  error?: string;
};

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "candidate") as "candidate" | "recruiter";

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address (e.g. you@company.com)." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { error: "That password is too common. Choose a stronger one." };
  }
  if (role !== "candidate" && role !== "recruiter") {
    return { error: "Invalid role selected." };
  }

  let existing: { id: string }[] = [];
  try {
    existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
  } catch {
    return { error: "Could not reach the database. Please try again in a moment." };
  }
  if (existing.length > 0) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  let user: { id: string; role: "candidate" | "recruiter" } | undefined;
  try {
    [user] = await db
      .insert(users)
      .values({ name, email, passwordHash, role })
      .returning({ id: users.id, role: users.role });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { error: "An account with this email already exists." };
    }
    return { error: "Could not reach the database. Please try again in a moment." };
  }

  try {
    await createSession(user.id);
  } catch {
    return { error: "Could not reach the database. Please try again in a moment." };
  }
  redirect(user.role === "recruiter" ? "/recruiter" : "/dashboard");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const ip = await getClientIp();
  const limit = await checkLoginRateLimit(email, ip);
  if (!limit.allowed) {
    return {
      error: `Too many failed attempts. Please try again in ${formatRetryMinutes(
        limit.retryAfterMs
      )}.`,
    };
  }

  let user: { id: string; passwordHash: string; role: "candidate" | "recruiter" } | undefined;
  try {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    user = rows[0];
  } catch {
    return { error: "Could not reach the database. Please try again in a moment." };
  }
  if (!user) {
    await recordFailedLogin(email, ip);
    return { error: "Invalid email or password." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(email, ip);
    return { error: "Invalid email or password." };
  }

  try {
    await clearLoginAttempts(email);
    await createSession(user.id);
  } catch {
    return { error: "Could not reach the database. Please try again in a moment." };
  }
  redirect(user.role === "recruiter" ? "/recruiter" : "/dashboard");
}

async function getClientIp(): Promise<string | undefined> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return store.get("x-real-ip") ?? undefined;
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === "23505") return true;
  const cause = (err as { cause?: { code?: string } } | null)?.cause;
  return cause?.code === "23505";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein",
  "admin123",
  "welcome1",
  "iloveyou",
  "abc12345",
  "monkey123",
  "dragon123",
  "password123",
]);

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
