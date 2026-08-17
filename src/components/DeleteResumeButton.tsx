"use client";

import { useTransition } from "react";
import { deleteResumeAction } from "@/actions/resumes";

export default function DeleteResumeButton({ resumeId }: { resumeId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this resume and its match history?")) {
          startTransition(() => deleteResumeAction(resumeId));
        }
      }}
      className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
