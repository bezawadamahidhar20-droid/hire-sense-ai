"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="font-mono-tight text-sm font-semibold uppercase tracking-wide text-rose-600">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-slate-950">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        An unexpected error occurred while rendering. Please try again, and if the
        problem persists, contact support.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
      >
        Try again
      </button>
    </div>
  );
}
