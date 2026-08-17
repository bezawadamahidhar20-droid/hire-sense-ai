import { extractSkills, semanticSimilarity } from "./skills";
import type { SkillEvidence } from "@/db/schema";

export type MatchResult = {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  semanticScore: number;
  atsScore: number;
  matchedSkills: SkillEvidence[];
  partialSkills: SkillEvidence[];
  missingSkills: string[];
  explanation: string;
  status: "shortlist" | "review" | "reject";
};

export function computeMatch(params: {
  resumeText: string;
  resumeSkills: Map<string, { count: number; sample: string }>;
  resumeExperienceYears: number;
  resumeAtsScore: number;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperienceYears: number;
}): MatchResult {
  const {
    resumeText,
    resumeSkills,
    resumeExperienceYears,
    resumeAtsScore,
    jobDescription,
    requiredSkills,
    preferredSkills,
    requiredExperienceYears,
  } = params;

  const matched: SkillEvidence[] = [];
  const partial: SkillEvidence[] = [];
  const missing: string[] = [];

  const allJobSkills = [
    ...requiredSkills.map((s) => ({ skill: s, weight: 1 })),
    ...preferredSkills.map((s) => ({ skill: s, weight: 0.5 })),
  ];

  let earnedWeight = 0;
  let totalWeight = 0;

  for (const { skill, weight } of allJobSkills) {
    totalWeight += weight;
    const evidence = resumeSkills.get(skill);
    if (!evidence) {
      missing.push(skill);
      continue;
    }
    if (evidence.count >= 2) {
      matched.push({
        skill,
        detail: `Mentioned ${evidence.count} times across the resume`,
      });
      earnedWeight += weight;
    } else {
      partial.push({
        skill,
        detail: `Mentioned once ("${evidence.sample}") — limited depth shown`,
      });
      earnedWeight += weight * 0.55;
    }
  }

  const skillScore =
    totalWeight === 0 ? 70 : Math.round((earnedWeight / totalWeight) * 100);

  // Experience score: full credit at/above requirement, tapering below it.
  let experienceScore: number;
  if (requiredExperienceYears <= 0) {
    experienceScore = 85;
  } else if (resumeExperienceYears >= requiredExperienceYears) {
    experienceScore = 100;
  } else {
    const ratio = resumeExperienceYears / requiredExperienceYears;
    experienceScore = Math.round(Math.max(30, ratio * 100));
  }

  const semanticScore = Math.max(
    35,
    semanticSimilarity(resumeText, jobDescription)
  );

  const overallScore = Math.round(
    skillScore * 0.4 +
      experienceScore * 0.2 +
      semanticScore * 0.2 +
      resumeAtsScore * 0.2
  );

  const status: MatchResult["status"] =
    overallScore >= 85 ? "shortlist" : overallScore >= 65 ? "review" : "reject";

  const explanation = buildExplanation({
    overallScore,
    matched,
    partial,
    missing,
    resumeExperienceYears,
    requiredExperienceYears,
  });

  return {
    overallScore,
    skillScore,
    experienceScore,
    semanticScore,
    atsScore: resumeAtsScore,
    matchedSkills: matched,
    partialSkills: partial,
    missingSkills: missing,
    explanation,
    status,
  };
}

function buildExplanation(params: {
  overallScore: number;
  matched: SkillEvidence[];
  partial: SkillEvidence[];
  missing: string[];
  resumeExperienceYears: number;
  requiredExperienceYears: number;
}): string {
  const { overallScore, matched, partial, missing, resumeExperienceYears, requiredExperienceYears } =
    params;

  const strengths =
    matched.length > 0
      ? `Strong evidence for ${matched
          .slice(0, 4)
          .map((m) => m.skill)
          .join(", ")}${matched.length > 4 ? ", among others" : ""} carries most of the score.`
      : "Few required skills were directly evidenced in the resume text.";

  const gaps: string[] = [];
  if (missing.length > 0) {
    gaps.push(
      `the resume doesn't show ${missing.slice(0, 3).join(", ")}${
        missing.length > 3 ? `, or ${missing.length - 3} other listed skill(s)` : ""
      }`
    );
  }
  if (partial.length > 0) {
    gaps.push(
      `${partial.map((p) => p.skill).join(", ")} ${
        partial.length === 1 ? "is" : "are"
      } only mentioned briefly, without depth`
    );
  }
  if (requiredExperienceYears > 0 && resumeExperienceYears < requiredExperienceYears) {
    gaps.push(
      `experience is ${resumeExperienceYears} year(s) versus the ${requiredExperienceYears}-year requirement`
    );
  }

  const gapSentence =
    gaps.length > 0
      ? `The gap comes from: ${gaps.join("; ")}.`
      : "No significant gaps were found against the listed requirements.";

  const tier =
    overallScore >= 85
      ? "Strong overall fit"
      : overallScore >= 65
      ? "Reasonable fit with some gaps"
      : "Limited fit for this role as written";

  return `${tier}. ${strengths} ${gapSentence}`;
}
