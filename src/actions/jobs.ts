"use server";

import { db } from "@/db";
import { jobs, resumes, matches } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseJobDescription } from "@/lib/jobParser";
import { extractResumeText, cleanText } from "@/lib/parseResume";
import { extractSkills, extractExperienceYears, extractEducation } from "@/lib/skills";
import { computeAtsScore } from "@/lib/ats";
import { computeMatch } from "@/lib/matching";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type JobFormState = {
  error?: string;
};

export async function createJobAction(
  _prevState: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") {
    return { error: "Only recruiters can create jobs." };
  }

  const title = String(formData.get("title") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const location = String(formData.get("location") || "Remote").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title || !description) {
    return { error: "Title and job description are required." };
  }

  const parsed = parseJobDescription(description);

  const [job] = await db
    .insert(jobs)
    .values({
      recruiterId: user.id,
      title,
      company,
      location,
      description,
      requiredSkills: parsed.requiredSkills,
      preferredSkills: parsed.preferredSkills,
      experienceYears: parsed.experienceYears.toString(),
      education: parsed.education,
      responsibilities: parsed.responsibilities,
    })
    .returning({ id: jobs.id });

  revalidatePath("/recruiter");
  redirect(`/recruiter/jobs/${job.id}`);
}

export type BatchUploadState = {
  error?: string;
  success?: string;
};

/**
 * Recruiter batch screening: upload multiple resume files for one job,
 * parse + score each one, and store a match row per resume.
 */
export async function screenCandidatesAction(
  _prevState: BatchUploadState,
  formData: FormData
): Promise<BatchUploadState> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") {
    return { error: "Only recruiters can screen candidates." };
  }

  const jobId = String(formData.get("jobId") || "");
  const jobRows = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.recruiterId, user.id)))
    .limit(1);
  const job = jobRows[0];
  if (!job) {
    return { error: "Job not found." };
  }

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) {
    return { error: "Select at least one resume file to screen." };
  }

  let processed = 0;
  for (const file of validFiles) {
    try {
      const rawText = cleanText(await extractResumeText(file));
      if (rawText.length < 40) continue;

      const skillsMap = extractSkills(rawText);
      const skills = Array.from(skillsMap.keys());
      const experienceYears = extractExperienceYears(rawText);
      const education = extractEducation(rawText);
      const { score: atsScore, checks } = computeAtsScore(rawText);

      const [resume] = await db
        .insert(resumes)
        .values({
          userId: user.id,
          fileName: file.name,
          rawText,
          skills,
          experienceYears: experienceYears.toString(),
          education,
          atsScore,
          atsChecks: checks,
        })
        .returning({ id: resumes.id });

      const result = computeMatch({
        resumeText: rawText,
        resumeSkills: skillsMap,
        resumeExperienceYears: experienceYears,
        resumeAtsScore: atsScore,
        jobDescription: job.description,
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        requiredExperienceYears: Number(job.experienceYears),
      });

      await db.insert(matches).values({
        resumeId: resume.id,
        jobId: job.id,
        jobTitleSnapshot: job.title,
        overallScore: result.overallScore,
        skillScore: result.skillScore,
        experienceScore: result.experienceScore,
        semanticScore: result.semanticScore,
        atsScore: result.atsScore,
        matchedSkills: result.matchedSkills,
        partialSkills: result.partialSkills,
        missingSkills: result.missingSkills,
        explanation: result.explanation,
        status: result.status,
      });
      processed++;
    } catch {
      // skip unreadable file, continue with the rest of the batch
      continue;
    }
  }

  revalidatePath(`/recruiter/jobs/${jobId}`);
  revalidatePath("/recruiter");
  if (processed === 0) {
    return { error: "None of the files could be processed. Try PDF, DOCX, or TXT." };
  }
  return { success: `Screened ${processed} candidate(s).` };
}

// Only recruiters who own the job may update a match's status.
// We join matches -> jobs and verify jobs.recruiterId = user.id to
// prevent IDOR attacks where a candidate or another recruiter could
// flip statuses on matches they don't own.
export async function updateMatchStatusAction(
  matchId: string,
  status: "shortlist" | "review" | "reject"
): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "recruiter") return;

  // Verify the match belongs to a job owned by this recruiter.
  const rows = await db
    .select({ jobId: matches.jobId })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  const matchRow = rows[0];
  if (!matchRow?.jobId) return;

  const jobRows = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, matchRow.jobId), eq(jobs.recruiterId, user.id)))
    .limit(1);
  if (jobRows.length === 0) return;

  await db
    .update(matches)
    .set({ status })
    .where(eq(matches.id, matchId));
  revalidatePath("/recruiter");
  revalidatePath(`/recruiter/jobs/${matchRow.jobId}`);
}
