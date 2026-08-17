import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes, matches } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, AtsStatusPill } from "@/components/ui";
import { generateImprovementSuggestions } from "@/lib/ats";

export const dynamic = "force-dynamic";

export default async function ImproveResumePage({
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

  const recentMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.resumeId, id))
    .orderBy(desc(matches.createdAt))
    .limit(5);

  const missingCounts = new Map<string, number>();
  for (const m of recentMatches) {
    for (const skill of m.missingSkills) {
      missingCounts.set(skill, (missingCounts.get(skill) ?? 0) + 1);
    }
  }
  const recommendedSkills = Array.from(missingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  const suggestions = generateImprovementSuggestions(resume.rawText, recommendedSkills);
  const contentSuggestions = suggestions.filter((s) => s.category === "content");
  const otherSuggestions = suggestions.filter((s) => s.category !== "content");

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-medium text-slate-950">ATS Score & Resume Improvement</h1>
        <p className="mt-1 text-slate-500">{resume.fileName}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <Card className="h-fit">
            <p className="text-sm font-medium text-slate-500">ATS score</p>
            <p className="font-mono-tight text-5xl font-semibold text-violet-700">{resume.atsScore}/100</p>
            <div className="mt-6 space-y-3">
              {resume.atsChecks.map((check) => (
                <div key={check.label} className="flex items-start gap-3">
                  <AtsStatusPill status={check.status} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{check.label}</p>
                    <p className="text-xs text-slate-500">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="font-display text-lg font-medium text-slate-950">Suggested rewrite</h2>
              <p className="mb-4 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Content
              </p>
              <div className="space-y-4">
                {contentSuggestions.map((s, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 p-4">
                    <p className="text-sm text-rose-700 line-through decoration-rose-300">{s.original}</p>
                    <p className="mt-2 text-sm font-medium text-emerald-700">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            </Card>

            {otherSuggestions.map((s, i) => (
              <Card key={i}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 capitalize">
                  {s.category}
                </p>
                <p className="text-sm text-slate-800">{s.suggestion}</p>
                <span
                  className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    s.priority === "high"
                      ? "bg-rose-100 text-rose-700"
                      : s.priority === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {s.priority} priority
                </span>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
