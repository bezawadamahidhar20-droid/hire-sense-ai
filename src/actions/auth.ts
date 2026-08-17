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

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
    throw err;
  }

  await createSession(user.id);
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

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    await recordFailedLogin(email, ip);
    return { error: "Invalid email or password." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(email, ip);
    return { error: "Invalid email or password." };
  }

  await clearLoginAttempts(email);
  await createSession(user.id);
  redirect(user.role === "recruiter" ? "/recruiter" : "/dashboard");
}

async function getClientIp(): Promise<string | undefined> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return store.get("x-real-ip") ?? undefined;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23505"
  );
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
