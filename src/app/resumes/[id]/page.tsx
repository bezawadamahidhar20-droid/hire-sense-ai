import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, matches } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, SkillChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, user.id)))
    .limit(1);
  const resume = rows[0];
  if (!resume) notFound();

  const resumeMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.resumeId, id))
    .orderBy(desc(matches.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium text-slate-950">{resume.fileName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Uploaded {new Date(resume.createdAt).toLocaleDateString()} · {resume.experienceYears} yrs experience · {resume.education}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/resumes/${resume.id}/improve`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
            >
              ATS & improvement
            </Link>
            <Link
              href={`/matches/new?resumeId=${resume.id}`}
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Run a new match
            </Link>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <p className="text-sm font-medium text-slate-500">ATS score</p>
            <p className="font-mono-tight text-4xl font-semibold text-violet-700">{resume.atsScore}</p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500">Skills detected</p>
            <p className="font-mono-tight text-4xl font-semibold text-slate-950">{resume.skills.length}</p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500">Matches run</p>
            <p className="font-mono-tight text-4xl font-semibold text-slate-950">{resumeMatches.length}</p>
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="font-display text-lg font-medium text-slate-950">Extracted skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {resume.skills.map((s) => (
              <SkillChip key={s} skill={s} variant="neutral" />
            ))}
            {resume.skills.length === 0 && (
              <p className="text-sm text-slate-500">No recognizable skills detected.</p>
            )}
          </div>
        </Card>

        <Card className="mt-6">
          <h2 className="font-display text-lg font-medium text-slate-950">Match history</h2>
          <div className="mt-3 space-y-2">
            {resumeMatches.map((m) => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <span className="text-sm font-medium text-slate-800">{m.jobTitleSnapshot}</span>
                <span className="font-mono-tight font-semibold text-violet-700">{m.overallScore}%</span>
              </Link>
            ))}
            {resumeMatches.length === 0 && (
              <p className="text-sm text-slate-500">No matches run for this resume yet.</p>
            )}
          </div>
        </Card>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <summary className="cursor-pointer font-display text-lg font-medium text-slate-950">
            Raw extracted text
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
            {resume.rawText}
          </pre>
        </details>
      </main>
    </div>
  );
}
