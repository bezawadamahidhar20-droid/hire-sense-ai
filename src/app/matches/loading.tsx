import Nav from "@/components/Nav";

export default function MatchesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 h-9 w-1/2 animate-pulse rounded-lg bg-slate-200" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </main>
    </div>
  );
}
