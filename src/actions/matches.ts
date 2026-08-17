"use server";

import { db } from "@/db";
import { matches, resumes, jobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { parseJobDescription } from "@/lib/jobParser";
import { extractSkills } from "@/lib/skills";
import { computeMatch } from "@/lib/matching";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type RunMatchState = {
  error?: string;
};

export async function runMatchAction(
  _prevState: RunMatchState,
  formData: FormData
): Promise<RunMatchState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const resumeId = String(formData.get("resumeId") || "");
  const jobTitle = String(formData.get("jobTitle") || "").trim() || "Untitled role";
  const jobDescription = String(formData.get("jobDescription") || "").trim();

  if (!resumeId || !jobDescription) {
    return { error: "Choose a resume and paste a job description." };
  }
  if (jobDescription.length < 30) {
    return { error: "Job description looks too short to analyze." };
  }

  const resumeRows = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)))
    .limit(1);
  const resume = resumeRows[0];
  if (!resume) {
    return { error: "Resume not found." };
  }

  const parsedJob = parseJobDescription(jobDescription);
  const skillsMap = extractSkills(resume.rawText);

  const [job] = await db
    .insert(jobs)
    .values({
      recruiterId: user.id,
      title: jobTitle,
      company: "",
      location: "",
      description: jobDescription,
      requiredSkills: parsedJob.requiredSkills,
      preferredSkills: parsedJob.preferredSkills,
      experienceYears: parsedJob.experienceYears.toString(),
      education: parsedJob.education,
      responsibilities: parsedJob.responsibilities,
    })
    .returning({ id: jobs.id });

  const result = computeMatch({
    resumeText: resume.rawText,
    resumeSkills: skillsMap,
    resumeExperienceYears: Number(resume.experienceYears),
    resumeAtsScore: resume.atsScore,
    jobDescription,
    requiredSkills: parsedJob.requiredSkills,
    preferredSkills: parsedJob.preferredSkills,
    requiredExperienceYears: parsedJob.experienceYears,
  });

  const [match] = await db
    .insert(matches)
    .values({
      resumeId: resume.id,
      jobId: job.id,
      jobTitleSnapshot: jobTitle,
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
    })
    .returning({ id: matches.id });

  revalidatePath("/dashboard");
  revalidatePath("/matches");
  redirect(`/matches/${match.id}`);
}
