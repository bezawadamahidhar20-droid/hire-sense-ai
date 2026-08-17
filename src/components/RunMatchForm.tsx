"use client";

import { useActionState } from "react";
import { runMatchAction, type RunMatchState } from "@/actions/matches";

const initialState: RunMatchState = {};

export default function RunMatchForm({
  resumeOptions,
  defaultResumeId,
}: {
  resumeOptions: { id: string; fileName: string }[];
  defaultResumeId?: string;
}) {
  const [state, formAction, pending] = useActionState(runMatchAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div>
        <label htmlFor="resumeId" className="mb-1.5 block text-sm font-medium text-slate-700">
          Resume
        </label>
        <select
          id="resumeId"
          name="resumeId"
          defaultValue={defaultResumeId}
          required
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
          <option value="" disabled>
            Choose a resume…
          </option>
          {resumeOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.fileName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="jobTitle" className="mb-1.5 block text-sm font-medium text-slate-700">
          Job title (optional)
        </label>
        <input
          id="jobTitle"
          name="jobTitle"
          type="text"
          placeholder="e.g. Python Backend Developer"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <div>
        <label htmlFor="jobDescription" className="mb-1.5 block text-sm font-medium text-slate-700">
          Job description
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          required
          rows={12}
          placeholder="Paste the full job description here…"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Analyzing…" : "Analyze my resume"}
      </button>
    </form>
  );
}
