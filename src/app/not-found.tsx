import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="font-mono-tight text-sm font-semibold uppercase tracking-wide text-violet-600">
        404 · Not found
      </p>
      <h1 className="mt-2 font-display text-3xl font-medium text-slate-950">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        The page or record you&apos;re looking for may have been moved or deleted.
        Check the URL, or head back to the home page.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
      >
        Back to home
      </Link>
    </div>
  );
}
