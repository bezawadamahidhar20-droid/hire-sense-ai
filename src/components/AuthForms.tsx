"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, signupAction, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      <Field label="Email" name="email" type="email" placeholder="you@company.com" />
      <Field label="Password" name="password" type="password" placeholder="••••••••" />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-violet-700">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const params = useSearchParams();
  const defaultRole = params.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [role, setRole] = useState<"candidate" | "recruiter">(defaultRole);
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div>
        <span className="mb-2 block text-sm font-medium text-slate-700">I am a…</span>
        <div className="grid grid-cols-2 gap-3">
          <RoleButton
            active={role === "candidate"}
            onClick={() => setRole("candidate")}
            label="Candidate"
            desc="Looking for a job"
          />
          <RoleButton
            active={role === "recruiter"}
            onClick={() => setRole("recruiter")}
            label="Recruiter"
            desc="Hiring for a role"
          />
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      <Field label="Full name" name="name" type="text" placeholder="Jane Doe" />
      <Field label="Email" name="email" type="email" placeholder="you@company.com" />
      <Field label="Password" name="password" type="password" placeholder="At least 8 characters" />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function RoleButton({
  active,
  onClick,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="block text-sm font-semibold text-slate-900">{label}</span>
      <span className="block text-xs text-slate-500">{desc}</span>
    </button>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        required
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
    </div>
  );
}
