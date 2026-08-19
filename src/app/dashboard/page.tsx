import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, matches } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Card, StatCard, SkillChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "recruiter") redirect("/recruiter");

  const myResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.createdAt));

  const resumeIds = myResumes.map((r) => r.id);
  const myMatches = resumeIds.length
    ? await db
        .select()
        .from(matches)
        .where(inArray(matches.resumeId, resumeIds))
        .orderBy(desc(matches.createdAt))
    : [];

  const latestResume = myResumes[0];
  const previousResume = myResumes[1];
  const scoreDelta = latestResume && previousResume ? latestResume.atsScore - previousResume.atsScore : null;

  const strongMatches = myMatches.filter((m) => m.overallScore >= 85).length;

  const topSkills = latestResume ? latestResume.skills.slice(0, 8) : [];

  const missingCounts = new Map<string, number>();
  for (const m of myMatches) {
    for (const skill of m.missingSkills) {
      missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
    }
  }
  const recommended = Array.from(missingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill]) => skill);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium text-slate-950">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-slate-500">Here&apos;s where your resume and matches stand today.</p>
          </div>
          <Link
            href="/matches/new"
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Run a new match →
          </Link>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <StatCard
            label="Resume score"
            value={latestResume ? latestResume.atsScore : "—"}
            tone={scoreDelta !== null && scoreDelta < 0 ? "negative" : "positive"}
            hint={
              scoreDelta === null
                ? undefined
                : scoreDelta >= 0
                ? `↑ ${scoreDelta} pts since last upload`
                : `↓ ${Math.abs(scoreDelta)} pts since last upload`
            }
          />
          <StatCard
            label="Job matches"
            value={myMatches.length}
            hint={strongMatches > 0 ? `${strongMatches} above 85%` : undefined}
          />
          <StatCard
            label="Analyses run"
            value={myMatches.length}
            hint={
              myMatches[0]
                ? `Last: ${timeAgo(myMatches[0].createdAt)}`
                : undefined
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="font-display text-lg font-medium text-slate-950">Skills overview</h2>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Top skills
              </p>
              <div className="flex flex-wrap gap-2">
                {topSkills.length > 0 ? (
                  topSkills.map((s) => <SkillChip key={s} skill={s} variant="matched" />)
                ) : (
                  <p className="text-sm text-slate-500">Upload a resume to see extracted skills.</p>
                )}
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recommended to learn
              </p>
              <div className="flex flex-wrap gap-2">
                {recommended.length > 0 ? (
                  recommended.map((s) => <SkillChip key={s} skill={s} variant="partial" />)
                ) : (
                  <p className="text-sm text-slate-500">Run a match to discover skill gaps.</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-medium text-slate-950">Recent matches</h2>
              <Link href="/matches" className="text-sm font-medium text-violet-700 hover:text-violet-900">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {myMatches.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{m.jobTitleSnapshot}</p>
                    <p className="text-xs text-slate-500">{timeAgo(m.createdAt)}</p>
                  </div>
                  <span
                    className={`font-mono-tight text-lg font-semibold ${
                      m.overallScore >= 85
                        ? "text-emerald-600"
                        : m.overallScore >= 65
                        ? "text-violet-600"
                        : "text-rose-600"
                    }`}
                  >
                    {m.overallScore}%
                  </span>
                </Link>
              ))}
              {myMatches.length === 0 && (
                <p className="text-sm text-slate-500">
                  No matches yet.{" "}
                  <Link href="/matches/new" className="font-medium text-violet-700">
                    Run your first analysis →
                  </Link>
                </p>
              )}
            </div>
          </Card>
        </div>

        {myResumes.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-6 text-center">
            <p className="text-sm text-violet-800">
              You haven&apos;t uploaded a resume yet.{" "}
              <Link href="/resumes" className="font-semibold underline">
                Upload one now
              </Link>{" "}
              to unlock matching and ATS scoring.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
