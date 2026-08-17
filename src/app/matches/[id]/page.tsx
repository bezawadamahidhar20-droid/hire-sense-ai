import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { matches, resumes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, ScoreRing, ProgressBar, SkillChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await db
    .select({ match: matches, resume: resumes })
    .from(matches)
    .innerJoin(resumes, eq(matches.resumeId, resumes.id))
    .where(and(eq(matches.id, id), eq(resumes.userId, user.id)))
    .limit(1);

  const row = rows[0];
  if (!row) notFound();
  const { match, resume } = row;

  const tier =
    match.overallScore >= 85
      ? "Strong match"
      : match.overallScore >= 65
      ? "Reasonable match"
      : "Weak match";

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          hiresense.ai/matches/{match.id.slice(0, 8)}
        </p>

        <Card className="mt-3 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={match.overallScore} label="Match" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {tier}
            </p>
            <h1 className="font-display text-2xl font-medium text-slate-950">
              {tier} — {match.jobTitleSnapshot}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Scored against resume &ldquo;{resume.fileName}&rdquo; using required skills, experience, and
              semantic fit against the job description.
            </p>
          </div>
        </Card>

        <Card className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <ProgressBar label="Skills match" value={match.skillScore} />
            <ProgressBar label="Experience" value={match.experienceScore} />
            <ProgressBar label="Semantic fit" value={match.semanticScore} />
            <ProgressBar label="ATS score" value={match.atsScore} />
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="mb-3 text-sm font-semibold text-emerald-700">✓ Matched</p>
            <div className="space-y-2">
              {match.matchedSkills.map((s) => (
                <div key={s.skill}>
                  <SkillChip skill={s.skill} variant="matched" />
                  <p className="mt-1 text-xs text-slate-500">{s.detail}</p>
                </div>
              ))}
              {match.matchedSkills.length === 0 && (
                <p className="text-xs text-slate-400">No strong matches found.</p>
              )}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-amber-700">⚠ Partial</p>
            <div className="space-y-2">
              {match.partialSkills.map((s) => (
                <div key={s.skill}>
                  <SkillChip skill={s.skill} variant="partial" />
                  <p className="mt-1 text-xs text-slate-500">{s.detail}</p>
                </div>
              ))}
              {match.partialSkills.length === 0 && (
                <p className="text-xs text-slate-400">No partial matches.</p>
              )}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-semibold text-rose-700">✗ Missing</p>
            <div className="flex flex-wrap gap-2">
              {match.missingSkills.map((s) => (
                <SkillChip key={s} skill={s} variant="missing" />
              ))}
              {match.missingSkills.length === 0 && (
                <p className="text-xs text-slate-400">Nothing missing — full coverage.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="mt-6 bg-violet-50/60">
          <p className="mb-2 text-sm font-semibold text-violet-800">Why {match.overallScore}%:</p>
          <p className="text-sm leading-relaxed text-slate-700">{match.explanation}</p>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/resumes/${resume.id}/improve`}
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            Improve this resume
          </Link>
          <Link
            href="/matches/new"
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Run another match
          </Link>
        </div>
      </main>
    </div>
  );
}
