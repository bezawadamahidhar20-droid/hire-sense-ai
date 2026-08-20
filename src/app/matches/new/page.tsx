import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui";
import RunMatchForm from "@/components/RunMatchForm";

export const dynamic = "force-dynamic";

export default async function NewMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string }>;
}) {
  const { resumeId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myResumes = await db
    .select({ id: resumes.id, fileName: resumes.fileName })
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.createdAt));

  const validResumeId = myResumes.some((r) => r.id === resumeId) ? resumeId : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-medium text-slate-950">Run a new match</h1>
        <p className="mt-1 text-slate-500">
          Paste a job description to see your match score, evidence, and gaps.
        </p>

        {myResumes.length === 0 ? (
          <Card className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              You need to upload a resume first.{" "}
              <Link href="/resumes" className="font-semibold text-violet-700">
                Upload one now →
              </Link>
            </p>
          </Card>
        ) : (
          <Card className="mt-6">
            <RunMatchForm resumeOptions={myResumes} defaultResumeId={validResumeId} />
          </Card>
        )}
      </main>
    </div>
  );
}
