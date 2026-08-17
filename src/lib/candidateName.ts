/** Best-effort guess at a candidate's display name from resume text or filename. */
export function guessCandidateName(rawText: string, fileName: string): string {
  const firstLines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);

  for (const line of firstLines) {
    const words = line.split(/\s+/);
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 4 &&
      line.length < 40 &&
      !/[@\d]/.test(line) &&
      words.every((w) => /^[A-Z][a-zA-Z'.-]*$/.test(w));
    if (looksLikeName) return line;
  }

  return fileName.replace(/\.(pdf|docx|txt)$/i, "").replace(/[_-]+/g, " ");
}
