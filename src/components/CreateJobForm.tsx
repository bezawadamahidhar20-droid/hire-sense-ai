"use client";

import { useActionState } from "react";
import { createJobAction, type JobFormState } from "@/actions/jobs";

const initialState: JobFormState = {};

export default function CreateJobForm() {
  const [state, formAction, pending] = useActionState(createJobAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Job title</span>
          <input
            required
            name="title"
            type="text"
            placeholder="Python Backend Developer"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Company</span>
          <input
            name="company"
            type="text"
            placeholder="Acme Inc."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Location</span>
        <input
          name="location"
          type="text"
          defaultValue="Remote"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Job description</span>
        <textarea
          required
          name="description"
          rows={12}
          placeholder={
            "Paste the full job description, including required and preferred skills, e.g.\n\nRequired: Python, SQL, FastAPI, Docker, AWS\n2+ years experience\n\nPreferred: React, Kubernetes"
          }
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
