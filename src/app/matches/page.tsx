import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { matches, resumes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({ match: matches, resumeFileName: resumes.fileName })
    .from(matches)
    .innerJoin(resumes, eq(matches.resumeId, resumes.id))
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(matches.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-medium text-slate-950">Job Matches</h1>
          <Link
            href="/matches/new"
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Run a new match →
          </Link>
        </div>

        <div className="space-y-3">
          {rows.map(({ match, resumeFileName }) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-violet-200 hover:shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">{match.jobTitleSnapshot}</p>
                <p className="text-xs text-slate-500">
                  {resumeFileName} · {new Date(match.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`font-mono-tight text-xl font-semibold ${
                  match.overallScore >= 85
                    ? "text-emerald-600"
                    : match.overallScore >= 65
                    ? "text-violet-600"
                    : "text-rose-600"
                }`}
              >
                {match.overallScore}%
              </span>
            </Link>
          ))}
          {rows.length === 0 && (
            <Card className="text-center text-sm text-slate-500">
              No analyses yet.{" "}
              <Link href="/matches/new" className="font-semibold text-violet-700">
                Run your first match →
              </Link>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
