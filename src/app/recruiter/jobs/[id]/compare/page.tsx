import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { jobs, matches, resumes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Card } from "@/components/ui";
import { guessCandidateName } from "@/lib/candidateName";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { id } = await params;
  const { ids } = await searchParams;
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

  const matchIds = (ids || "").split(",").filter(Boolean);
  if (matchIds.length === 0) redirect(`/recruiter/jobs/${id}`);

  const rows = await db
    .select({ match: matches, resume: resumes })
    .from(matches)
    .innerJoin(resumes, eq(matches.resumeId, resumes.id))
    .where(and(eq(matches.jobId, id), inArray(matches.id, matchIds)));

  const allSkills = Array.from(new Set([...job.requiredSkills, ...job.preferredSkills]));

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href={`/recruiter/jobs/${id}`} className="text-sm font-medium text-violet-700">
          ← Back to {job.title}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium text-slate-950">Compare candidates</h1>

        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Category
                </th>
                {rows.map(({ resume }) => (
                  <th key={resume.id} className="py-2 pr-4 text-sm font-semibold text-slate-900">
                    {guessCandidateName(resume.rawText, resume.fileName)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium text-slate-600">Match score</td>
                {rows.map(({ match }) => (
                  <td key={match.id} className="py-3 pr-4 font-mono-tight font-semibold text-violet-700">
                    {match.overallScore}%
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium text-slate-600">Experience</td>
                {rows.map(({ resume }) => (
                  <td key={resume.id} className="py-3 pr-4 text-slate-800">
                    {resume.experienceYears} yrs
                  </td>
                ))}
              </tr>
              {allSkills.map((skill) => (
                <tr key={skill} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-slate-600">{skill}</td>
                  {rows.map(({ match, resume }) => {
                    const isMatched = match.matchedSkills.some((s) => s.skill === skill);
                    const isPartial = match.partialSkills.some((s) => s.skill === skill);
                    return (
                      <td key={resume.id} className="py-3 pr-4">
                        {isMatched ? (
                          <span className="text-emerald-600">✓</span>
                        ) : isPartial ? (
                          <span className="text-amber-600">⚠</span>
                        ) : (
                          <span className="text-rose-600">✗</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
