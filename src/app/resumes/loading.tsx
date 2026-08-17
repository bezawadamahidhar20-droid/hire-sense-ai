import Nav from "@/components/Nav";

export default function ResumesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="h-9 w-1/2 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-slate-200" />
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </main>
    </div>
  );
}
