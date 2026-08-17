"use client";

import { useActionState, useState } from "react";
import { uploadResumeAction, type UploadState } from "@/actions/resumes";

const initialState: UploadState = {};

export default function UploadResumeForm() {
  const [state, formAction, pending] = useActionState(uploadResumeAction, initialState);
  const [mode, setMode] = useState<"file" | "paste">("file");

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <div className="flex gap-2">
        <ModeButton active={mode === "file"} onClick={() => setMode("file")} label="Upload file" />
        <ModeButton active={mode === "paste"} onClick={() => setMode("paste")} label="Paste text" />
      </div>

      {mode === "file" ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-violet-400 hover:bg-violet-50/40">
          <span className="text-sm font-medium text-slate-700">
            Drop a PDF, DOCX, or TXT resume, or click to browse
          </span>
          <span className="mt-1 text-xs text-slate-400">Max 5MB</span>
          <input type="file" name="file" accept=".pdf,.docx,.txt" className="hidden" />
        </label>
      ) : (
        <textarea
          name="pastedText"
          rows={10}
          placeholder="Paste your resume text here…"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Analyzing…" : "Upload & analyze"}
      </button>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
