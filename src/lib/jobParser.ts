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
  // Only treat "preferred" / "nice-to-have" as a section boundary when it
  // looks like an actual heading — e.g. it starts at the beginning of a line,
  // is relatively short (< 40 chars), and/or is followed by a colon or newline.
  // This prevents mid-sentence mentions like
  //   "Experience with Kubernetes is preferred but not required"
  // from splitting the description prematurely.
  //
  // Examples:
  //   ✗ "...is preferred but not required..." — mid-sentence, NOT a heading
  //   ✓ "Preferred Skills:\n" — starts at line start, short, colon
  //   ✓ "Nice-to-Have" — standalone short line
  const lines = description.split("\n");
  let splitIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^(preferred|nice[- ]to[- ]have|bonus|good to have)[^\n]{0,30}[:]?$/i.test(trimmed)) {
      splitIndex = i;
      break;
    }
  }

  let requiredText = description;
  let preferredText = "";

  if (splitIndex >= 0) {
    requiredText = lines.slice(0, splitIndex).join("\n");
    preferredText = lines.slice(splitIndex).join("\n");
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
