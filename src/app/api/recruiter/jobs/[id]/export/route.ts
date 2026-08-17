import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { jobs, matches, resumes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { guessCandidateName } from "@/lib/candidateName";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  let str = String(value);
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") {
    return new Response("Unauthorized", { status: 401 });
  }

  const jobRows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.recruiterId, user.id)))
    .limit(1);
  const job = jobRows[0];
  if (!job) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select({ match: matches, resume: resumes })
    .from(matches)
    .innerJoin(resumes, eq(matches.resumeId, resumes.id))
    .where(eq(matches.jobId, id))
    .orderBy(desc(matches.overallScore));

  const header = [
    "Rank",
    "Candidate",
    "Match Score",
    "Skills Score",
    "Experience Score",
    "Semantic Score",
    "ATS Score",
    "Experience Years",
    "Matched Skills",
    "Missing Skills",
    "Status",
  ];

  const lines = [header.map(csvEscape).join(",")];
  rows.forEach(({ match, resume }, idx) => {
    lines.push(
      [
        idx + 1,
        guessCandidateName(resume.rawText, resume.fileName),
        match.overallScore,
        match.skillScore,
        match.experienceScore,
        match.semanticScore,
        match.atsScore,
        resume.experienceYears,
        match.matchedSkills.map((s) => s.skill).join("; "),
        match.missingSkills.join("; "),
        match.status,
      ]
        .map(csvEscape)
        .join(",")
    );
  });

  const csv = lines.join("\n");
  const safeTitle = job.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeTitle}-candidates.csv"`,
    },
  });
}
