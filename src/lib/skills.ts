// A curated dictionary of common tech / professional skills used for
// deterministic, explainable extraction (no black-box embeddings needed).
// Each entry maps a canonical skill name to a list of surface forms /
// synonyms that should be recognised as evidence for that skill.

export const SKILL_DICTIONARY: Record<string, string[]> = {
  Python: ["python", "python3"],
  JavaScript: ["javascript", "js", "es6", "ecmascript"],
  TypeScript: ["typescript", "ts"],
  Java: ["java"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp"],
  Go: ["golang", " go "],
  Ruby: ["ruby"],
  PHP: ["php"],
  SQL: ["sql", "structured query language"],
  NoSQL: ["nosql", "mongodb", "dynamodb", "cassandra"],
  React: ["react", "reactjs", "react.js"],
  "Next.js": ["next.js", "nextjs"],
  "Vue.js": ["vue", "vuejs", "vue.js"],
  Angular: ["angular", "angularjs"],
  "Node.js": ["node.js", "nodejs", "node js"],
  FastAPI: ["fastapi"],
  Django: ["django"],
  Flask: ["flask"],
  "Spring Boot": ["spring boot", "spring framework", "springboot"],
  "REST APIs": ["rest api", "restful", "rest apis", "web services", "api development"],
  GraphQL: ["graphql"],
  Docker: ["docker", "containerization"],
  Kubernetes: ["kubernetes", "k8s"],
  AWS: ["aws", "amazon web services", "ec2", "s3 bucket", "lambda"],
  Azure: ["azure", "microsoft azure"],
  GCP: ["gcp", "google cloud"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions"],
  Git: ["git", "github", "gitlab", "version control"],
  Linux: ["linux", "unix", "bash", "shell scripting"],
  "Machine Learning": ["machine learning", "ml model", "scikit-learn", "sklearn"],
  "Deep Learning": ["deep learning", "neural network", "tensorflow", "pytorch"],
  "Data Analysis": ["data analysis", "data analytics", "pandas", "numpy"],
  "Data Visualization": ["data visualization", "tableau", "power bi", "matplotlib"],
  "HTML/CSS": ["html", "css", "html5", "css3", "tailwind", "sass"],
  Redux: ["redux"],
  MongoDB: ["mongodb", "mongo db"],
  PostgreSQL: ["postgresql", "postgres"],
  MySQL: ["mysql"],
  Redis: ["redis"],
  Kafka: ["kafka", "event streaming"],
  Microservices: ["microservices", "microservice architecture"],
  "Agile/Scrum": ["agile", "scrum", "kanban", "sprint planning"],
  Testing: ["unit testing", "pytest", "jest", "test-driven", "tdd", "qa"],
  "Project Management": ["project management", "jira", "confluence"],
  "Machine Learning Ops": ["mlops", "ml ops"],
  "Natural Language Processing": ["nlp", "natural language processing", "spacy", "transformers"],
  Excel: ["excel", "spreadsheets"],
  "Product Management": ["product management", "roadmap", "product owner"],
  Communication: ["communication skills", "stakeholder management"],
  Leadership: ["leadership", "team lead", "mentoring"],
  Salesforce: ["salesforce", "crm"],
  Terraform: ["terraform", "infrastructure as code", "iac"],
  Kotlin: ["kotlin"],
  Swift: ["swift", "ios development"],
  "Android Development": ["android", "android development", "kotlin android"],
  "Machine Vision": ["computer vision", "opencv"],
  "Cyber Security": ["cybersecurity", "cyber security", "penetration testing", "infosec"],
  "Business Analysis": ["business analysis", "requirements gathering"],
  R: [" r programming", "r language", "rstudio"],
};

export const ALL_SKILLS = Object.keys(SKILL_DICTIONARY);

/**
 * Scan free text and return the canonical skills detected, along with a
 * lightweight confidence signal (how many times / how prominently they
 * appear) so the caller can distinguish strong evidence from a single
 * passing mention (used for "partial match" evidence).
 */
export function extractSkills(text: string): Map<string, { count: number; sample: string }> {
  const found = new Map<string, { count: number; sample: string }>();
  const haystack = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;

  for (const [canonical, synonyms] of Object.entries(SKILL_DICTIONARY)) {
    let count = 0;
    let sample = "";
    for (const syn of synonyms) {
      const needle = syn.toLowerCase();
      const escaped = needle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "gi");
      const matches = haystack.match(re);
      if (matches) {
        count += matches.length;
        if (!sample) sample = syn.trim();
      }
    }
    if (count > 0) {
      found.set(canonical, { count, sample });
    }
  }
  return found;
}

const STOPWORDS = new Set(
  "the a an and or but for with without into onto to of in on at by from as is are was were be been being this that these those it its their our your you we they he she i also will would can could should shall may might must have has had do does did not no yes if then than so such etc".split(
    " "
  )
);

/** Tokenize text into meaningful keywords (used for semantic overlap). */
export function keywordSet(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/** Jaccard similarity between two keyword sets, expressed 0-100. */
export function semanticSimilarity(a: string, b: string): number {
  const setA = keywordSet(a);
  const setB = keywordSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  if (intersection === 0) return 0;
  // Scale so realistic overlaps (10-30%) map into a more legible 40-95 range.
  return Math.round(Math.min(100, jaccard * 260));
}

export function extractExperienceYears(text: string): number {
  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s*(?:of)?\s*(?:experience|exp)/gi,
    /(?:experience|exp)\s*(?:of)?\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)/gi,
  ];
  let max = 0;
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const val = parseFloat(m[1]);
      if (!Number.isNaN(val)) max = Math.max(max, val);
    }
  }
  if (max > 0) return max;

  // Fall back: sum date ranges like "2021 - 2023" or "2021 - Present".
  // Overlapping or duplicate ranges are merged so they aren't double-counted.
  const rangeRe = /(19|20)\d{2}\s*[-–to]+\s*(present|current|(19|20)\d{2})/gi;
  const ranges: [number, number][] = [];
  let m: RegExpExecArray | null;
  const now = new Date().getFullYear();
  const MAX_RANGE_YEARS = 50;
  while ((m = rangeRe.exec(text)) !== null) {
    const start = parseInt(m[0].match(/(19|20)\d{2}/)?.[0] ?? `${now}`, 10);
    const isPresent = /present|current/i.test(m[2]);
    const end = isPresent ? now : parseInt(m[2], 10);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      // Cap individual range to a sane maximum to guard against garbage matches.
      const spanYears = Math.min(end - start, MAX_RANGE_YEARS);
      ranges.push([start, start + spanYears]);
    }
  }
  // Merge overlapping / adjacent intervals (standard interval-merge).
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of ranges) {
    if (merged.length === 0 || s > merged[merged.length - 1][1]) {
      merged.push([s, e]);
    } else {
      // Overlap — extend the end if this range ends later.
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    }
  }
  let mergedMonths = 0;
  for (const [s, e] of merged) {
    mergedMonths += (e - s) * 12;
  }
  return Math.round((mergedMonths / 12) * 10) / 10;
}

export function extractEducation(text: string): string {
  const lower = text.toLowerCase();
  if (/ph\.?d|doctorate/.test(lower)) return "PhD";
  if (/m\.?tech|m\.?s\.?c?\b|master'?s|mba/.test(lower)) return "Master's degree";
  if (/b\.?tech|b\.?e\.?\b|b\.?sc|bachelor'?s/.test(lower)) return "Bachelor's degree";
  if (/diploma/.test(lower)) return "Diploma";
  if (/high school|hsc/.test(lower)) return "High school";
  return "Not specified";
}
