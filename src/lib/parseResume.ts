import mammoth from "mammoth";

/**
 * Extract raw text from an uploaded resume file. Supports PDF, DOCX and
 * plain text. Falls back to reading the buffer as UTF-8 text for any other
 * type so the flow never hard-fails on unexpected input.
 */
export async function extractResumeText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse-fork")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // .txt or unknown — treat as plain text.
  return buffer.toString("utf-8");
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
