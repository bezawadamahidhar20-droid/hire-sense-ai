import { extractSkills, extractExperienceYears, extractEducation } from "./skills";

export type ParsedJob = {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceYears: number;
  education: string;
  responsibilities: string[];
};

/**
 * Split a job description into a "required" section and a "preferred /
 * nice-to-have" section using common heading patterns, then extract skills
 * from each independently. Falls back to treating everything as required
 * when no explicit preferred section exists.
 */
export function parseJobDescription(description: string): ParsedJob {
  const lower = description.toLowerCase();
  const preferredHeadingRe =
    /(preferred|nice[- ]to[- ]have|bonus|good to have)[^\n]*:?/i;
  const preferredMatch = preferredHeadingRe.exec(description);

  let requiredText = description;
  let preferredText = "";

  if (preferredMatch) {
    requiredText = description.slice(0, preferredMatch.index);
    preferredText = description.slice(preferredMatch.index);
  }

  const requiredSkillsMap = extractSkills(requiredText);
  const preferredSkillsMap = extractSkills(preferredText);

  const requiredSkills = Array.from(requiredSkillsMap.keys());
  const preferredSkills = Array.from(preferredSkillsMap.keys()).filter(
    (s) => !requiredSkills.includes(s)
  );

  const experienceYears = extractExperienceYears(description);
  const education = extractEducation(description);

  const responsibilities = extractResponsibilities(description);

  return {
    requiredSkills,
    preferredSkills,
    experienceYears,
    education,
    responsibilities,
  };

  void lower;
}

function extractResponsibilities(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[\s•*-]+/, "").trim())
    .filter(Boolean);

  const verbStart =
    /^(develop|build|design|maintain|deploy|manage|lead|collaborate|write|implement|own|drive|analyze|create|support|optimize|test|monitor|coordinate)/i;

  const responsibilities = lines.filter((l) => verbStart.test(l) && l.length < 160);
  return responsibilities.slice(0, 8);
}
