import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui";
import UploadResumeForm from "@/components/UploadResumeForm";
import DeleteResumeButton from "@/components/DeleteResumeButton";

export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const myResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.createdAt));

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-medium text-slate-950">My Resumes</h1>
        <p className="mt-1 text-slate-500">Upload a resume to extract skills, experience, and an ATS score.</p>

        <Card className="mt-6">
          <UploadResumeForm />
        </Card>

        <div className="mt-8 space-y-3">
          {myResumes.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"
            >
              <div>
                <Link href={`/resumes/${r.id}`} className="font-semibold text-slate-900 hover:text-violet-700">
                  {r.fileName}
                </Link>
                <p className="text-xs text-slate-500">
                  {r.skills.length} skills detected · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono-tight text-lg font-semibold text-violet-700">
                  ATS {r.atsScore}
                </span>
                <Link
                  href={`/resumes/${r.id}/improve`}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                >
                  Improve
                </Link>
                <Link
                  href={`/matches/new?resumeId=${r.id}`}
                  className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Run match
                </Link>
                <DeleteResumeButton resumeId={r.id} />
              </div>
            </div>
          ))}
          {myResumes.length === 0 && (
            <p className="text-center text-sm text-slate-500">No resumes uploaded yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
