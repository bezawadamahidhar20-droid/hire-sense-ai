import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { jobs, matches, resumes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, SkillChip } from "@/components/ui";
import ScreenCandidatesForm from "@/components/ScreenCandidatesForm";
import CandidateTable, { type CandidateRow } from "@/components/CandidateTable";
import { guessCandidateName } from "@/lib/candidateName";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "recruiter") redirect("/dashboard");

  const jobRows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.recruiterId, user.id)))
    .limit(1);
  const job = jobRows[0];
  if (!job) notFound();

  const rows = await db
    .select({ match: matches, resume: resumes })
    .from(matches)
    .innerJoin(resumes, eq(matches.resumeId, resumes.id))
    .where(eq(matches.jobId, job.id))
    .orderBy(desc(matches.overallScore));

  const totalSkills = job.requiredSkills.length + job.preferredSkills.length;
  const candidates: CandidateRow[] = rows.map(({ match, resume }) => ({
    matchId: match.id,
    resumeId: resume.id,
    name: guessCandidateName(resume.rawText, resume.fileName),
    score: match.overallScore,
    matchedCount: match.matchedSkills.length,
    totalSkills: totalSkills || match.matchedSkills.length + match.missingSkills.length,
    experienceYears: Number(resume.experienceYears),
    status: match.status,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-medium text-slate-950">{job.title}</h1>
          <p className="mt-1 text-slate-500">
            {job.company || "No company set"} · {job.location} · {rows.length} candidates screened
          </p>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <ScreenCandidatesForm jobId={job.id} />
          </Card>
          <Card>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Required skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => (
                <SkillChip key={s} skill={s} variant="neutral" />
              ))}
              {job.requiredSkills.length === 0 && (
                <p className="text-xs text-slate-400">None detected — add specifics to the JD.</p>
              )}
            </div>
            {job.preferredSkills.length > 0 && (
              <>
                <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Preferred skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map((s) => (
                    <SkillChip key={s} skill={s} variant="partial" />
                  ))}
                </div>
              </>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Requires {Number(job.experienceYears) || "no minimum"} {Number(job.experienceYears) ? "yrs" : ""}{" "}
              experience · {job.education}
            </p>
          </Card>
        </div>

        <CandidateTable jobId={job.id} candidates={candidates} />
      </main>
    </div>
  );
}
