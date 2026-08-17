import Nav from "@/components/Nav";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </main>
    </div>
  );
}
