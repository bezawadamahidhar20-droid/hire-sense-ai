import type { AtsCheck } from "@/db/schema";
import { extractSkills } from "./skills";

const SECTION_HEADINGS = [
  /education/i,
  /experience|employment|work history/i,
  /skills/i,
  /projects/i,
];

const WEAK_PHRASES = [
  "worked on",
  "responsible for",
  "helped with",
  "involved in",
  "assisted with",
  "duties included",
  "tasked with",
];

export function computeAtsScore(text: string): {
  score: number;
  checks: AtsCheck[];
} {
  const checks: AtsCheck[] = [];
  let score = 0;

  // 1. Clear structure — standard section headings present.
  const headingsFound = SECTION_HEADINGS.filter((re) => re.test(text)).length;
  if (headingsFound >= 3) {
    checks.push({
      label: "Clear structure",
      status: "pass",
      detail: "Standard section headings detected (education, experience, skills).",
    });
    score += 20;
  } else if (headingsFound >= 1) {
    checks.push({
      label: "Clear structure",
      status: "warn",
      detail: "Some standard sections are missing or unlabeled.",
    });
    score += 10;
  } else {
    checks.push({
      label: "Clear structure",
      status: "fail",
      detail: "No standard section headings found — ATS parsers may misread this resume.",
    });
  }

  // 2. Contact info present.
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  if (hasEmail && hasPhone) {
    checks.push({
      label: "Contact information",
      status: "pass",
      detail: "Email and phone number both detected.",
    });
    score += 15;
  } else if (hasEmail || hasPhone) {
    checks.push({
      label: "Contact information",
      status: "warn",
      detail: "Only one contact method detected — add both email and phone.",
    });
    score += 8;
  } else {
    checks.push({
      label: "Contact information",
      status: "fail",
      detail: "No email or phone number detected.",
    });
  }

  // 3. Relevant keywords / skills present.
  const skills = extractSkills(text);
  if (skills.size >= 8) {
    checks.push({
      label: "Relevant keywords",
      status: "pass",
      detail: `${skills.size} recognizable skill keywords found.`,
    });
    score += 20;
  } else if (skills.size >= 3) {
    checks.push({
      label: "Relevant keywords",
      status: "warn",
      detail: `Only ${skills.size} skill keywords found — consider listing more relevant tools.`,
    });
    score += 12;
  } else {
    checks.push({
      label: "Relevant keywords",
      status: "fail",
      detail: "Very few recognizable skill keywords found.",
    });
  }

  // 4. Measurable achievements (numbers / percentages).
  const hasMetrics = /\d+(%|\+)|\$\d+|\b\d+x\b/i.test(text);
  if (hasMetrics) {
    checks.push({
      label: "Measurable achievements",
      status: "pass",
      detail: "Quantified results (numbers, percentages) found in resume text.",
    });
    score += 15;
  } else {
    checks.push({
      label: "Measurable achievements",
      status: "warn",
      detail: "No quantified achievements found — add metrics like % improvement or scale.",
    });
    score += 4;
  }

  // 5. Bullet / formatting hygiene.
  const bulletLines = (text.match(/^[\s]*[-•*]/gm) || []).length;
  if (bulletLines >= 4) {
    checks.push({
      label: "Bullet point usage",
      status: "pass",
      detail: "Resume uses bullet points for scannability.",
    });
    score += 10;
  } else {
    checks.push({
      label: "Bullet point usage",
      status: "warn",
      detail: "Few or no bullet points detected — dense paragraphs are harder for ATS parsers.",
    });
    score += 3;
  }

  // 6. Length check.
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 150 && wordCount <= 1200) {
    checks.push({
      label: "Resume length",
      status: "pass",
      detail: `${wordCount} words — within a typical readable range.`,
    });
    score += 10;
  } else if (wordCount < 150) {
    checks.push({
      label: "Resume length",
      status: "warn",
      detail: `${wordCount} words — resume may be too thin on detail.`,
    });
    score += 4;
  } else {
    checks.push({
      label: "Resume length",
      status: "warn",
      detail: `${wordCount} words — consider trimming to stay concise.`,
    });
    score += 6;
  }

  // 7. Avoid tables/text boxes hints (hard to detect from text alone) — reward
  // simple, linear text with consistent spacing.
  const suspiciousTabs = (text.match(/\t{2,}/g) || []).length;
  if (suspiciousTabs === 0) {
    checks.push({
      label: "Parser-friendly layout",
      status: "pass",
      detail: "No tab-heavy layout patterns detected that commonly break ATS parsing.",
    });
    score += 10;
  } else {
    checks.push({
      label: "Parser-friendly layout",
      status: "warn",
      detail: "Complex spacing detected — tables or columns may not extract cleanly.",
    });
    score += 4;
  }

  return { score: Math.max(0, Math.min(100, score)), checks };
}

export type RewriteSuggestion = {
  category: "content" | "skills" | "formatting" | "experience";
  original: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
};

export function generateImprovementSuggestions(
  text: string,
  recommendedSkills: string[]
): RewriteSuggestion[] {
  const suggestions: RewriteSuggestion[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    const weak = WEAK_PHRASES.find((p) => lower.includes(p));
    if (weak && line.length < 140) {
      const actionVerb = pickActionVerb(lower);
      const rewritten = rewriteWeakLine(line, actionVerb);
      suggestions.push({
        category: "content",
        original: line,
        suggestion: rewritten,
        priority: "high",
      });
    }
    if (suggestions.filter((s) => s.category === "content").length >= 3) break;
  }

  if (suggestions.length === 0) {
    suggestions.push({
      category: "content",
      original: "General bullet phrasing",
      suggestion:
        "Lead each bullet with a strong action verb (Built, Led, Designed, Optimized) and close with a measurable result, e.g. \"Optimized the checkout flow, reducing cart abandonment by 18%.\"",
      priority: "medium",
    });
  }

  if (recommendedSkills.length > 0) {
    suggestions.push({
      category: "skills",
      original: "Skills section",
      suggestion: `Add ${recommendedSkills.slice(0, 3).join(", ")} — these appear frequently in jobs you've matched against but aren't on your resume yet.`,
      priority: "high",
    });
  }

  const hasMetrics = /\d+(%|\+)|\$\d+/.test(text);
  if (!hasMetrics) {
    suggestions.push({
      category: "experience",
      original: "Experience bullets without metrics",
      suggestion:
        "Quantify at least one result per role — team size, % improvement, time saved, revenue impact, or scale (e.g. \"served 10k+ daily users\").",
      priority: "high",
    });
  }

  const headingsFound = SECTION_HEADINGS.filter((re) => re.test(text)).length;
  if (headingsFound < 3) {
    suggestions.push({
      category: "formatting",
      original: "Section headings",
      suggestion:
        "Use standard section headings (Education, Experience, Skills, Projects) so ATS parsers can reliably map your content.",
      priority: "medium",
    });
  }

  return suggestions;
}

function pickActionVerb(lower: string): string {
  if (lower.includes("website") || lower.includes("app") || lower.includes("develop"))
    return "Built";
  if (lower.includes("team") || lower.includes("manage")) return "Led";
  if (lower.includes("data") || lower.includes("analy")) return "Analyzed";
  if (lower.includes("design")) return "Designed";
  if (lower.includes("test")) return "Engineered";
  return "Delivered";
}

function rewriteWeakLine(line: string, verb: string): string {
  const cleaned = line
    .replace(/^(worked on|responsible for|helped with|involved in|assisted with|duties included|tasked with)/i, "")
    .trim();
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${verb} ${capitalized.replace(/\.$/, "")}, improving efficiency by an estimated 20-30% (add your real metric here).`;
}
