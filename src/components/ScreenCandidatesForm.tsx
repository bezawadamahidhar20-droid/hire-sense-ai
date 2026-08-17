"use client";

import { useActionState } from "react";
import { screenCandidatesAction, type BatchUploadState } from "@/actions/jobs";

const initialState: BatchUploadState = {};

export default function ScreenCandidatesForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(screenCandidatesAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{state.success}</p>
      )}
      <label
        htmlFor="screen-files"
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50/40"
      >
        <span className="text-sm font-medium text-slate-700">
          Upload resumes to screen against this job (PDF, DOCX, TXT)
        </span>
        <span className="mt-1 text-xs text-slate-400">Select multiple files at once</span>
        <input
          id="screen-files"
          type="file"
          name="files"
          accept=".pdf,.docx,.txt"
          multiple
          className="hidden"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Screening…" : "Screen candidates"}
      </button>
    </form>
  );
}
