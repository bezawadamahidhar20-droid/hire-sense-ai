import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { jobs, matches } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { Card, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RecruiterDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "recruiter") redirect("/dashboard");

  const myJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.recruiterId, user.id))
    .orderBy(desc(jobs.createdAt));

  const jobIds = myJobs.map((j) => j.id);
  const allMatches = jobIds.length
    ? await db.select().from(matches).where(inArray(matches.jobId, jobIds))
    : [];

  const countsByJob = new Map<string, number>();
  for (const m of allMatches) {
    if (!m.jobId) continue;
    countsByJob.set(m.jobId, (countsByJob.get(m.jobId) ?? 0) + 1);
  }

  const shortlisted = allMatches.filter((m) => m.status === "shortlist").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium text-slate-950">Recruiter Dashboard</h1>
            <p className="mt-1 text-slate-500">Command center for your open roles and candidate pipeline.</p>
          </div>
          <Link
            href="/recruiter/jobs/new"
            className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            + New job
          </Link>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-4">
          <StatCard label="Active jobs" value={myJobs.length} />
          <StatCard label="Candidates received" value={allMatches.length} />
          <StatCard label="Screened" value={allMatches.length} />
          <StatCard label="Shortlisted" value={shortlisted} />
        </div>

        <Card>
          <h2 className="font-display text-lg font-medium text-slate-950">Recent jobs</h2>
          <div className="mt-4 space-y-2">
            {myJobs.map((job) => (
              <Link
                key={job.id}
                href={`/recruiter/jobs/${job.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.company || "No company set"} · {job.location}</p>
                </div>
                <span className="text-sm font-medium text-slate-600">
                  {countsByJob.get(job.id) ?? 0} candidates
                </span>
              </Link>
            ))}
            {myJobs.length === 0 && (
              <p className="text-sm text-slate-500">
                No jobs yet.{" "}
                <Link href="/recruiter/jobs/new" className="font-semibold text-violet-700">
                  Create your first job →
                </Link>
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
