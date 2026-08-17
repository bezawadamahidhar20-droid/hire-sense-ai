import Nav from "@/components/Nav";

export default function RecruiterLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="h-9 w-1/2 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mb-8 grid gap-5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </main>
    </div>
  );
}
