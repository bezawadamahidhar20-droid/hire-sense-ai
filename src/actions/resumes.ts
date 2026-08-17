"use server";

import { db } from "@/db";
import { resumes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { extractResumeText, cleanText } from "@/lib/parseResume";
import { extractSkills, extractExperienceYears, extractEducation } from "@/lib/skills";
import { computeAtsScore } from "@/lib/ats";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type UploadState = {
  error?: string;
};

export async function uploadResumeAction(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const file = formData.get("file") as File | null;
  const pastedText = String(formData.get("pastedText") || "").trim();

  let rawText = "";
  let fileName = "Pasted resume";

  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File is too large (max 5MB)." };
    }
    try {
      rawText = cleanText(await extractResumeText(file));
      fileName = file.name;
    } catch {
      return { error: "Could not read that file. Try a PDF, DOCX, or TXT file." };
    }
  } else if (pastedText) {
    rawText = cleanText(pastedText);
  } else {
    return { error: "Upload a file or paste your resume text." };
  }

  if (rawText.length < 40) {
    return { error: "That resume looks too short to analyze — add more content." };
  }

  const skillsMap = extractSkills(rawText);
  const skills = Array.from(skillsMap.keys());
  const experienceYears = extractExperienceYears(rawText);
  const education = extractEducation(rawText);
  const { score: atsScore, checks } = computeAtsScore(rawText);

  const [resume] = await db
    .insert(resumes)
    .values({
      userId: user.id,
      fileName,
      rawText,
      skills,
      experienceYears: experienceYears.toString(),
      education,
      atsScore,
      atsChecks: checks,
    })
    .returning({ id: resumes.id });

  revalidatePath("/dashboard");
  revalidatePath("/resumes");
  redirect(`/resumes/${resume.id}`);
}

export async function deleteResumeAction(resumeId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, user.id)));
  revalidatePath("/resumes");
  revalidatePath("/dashboard");
}
