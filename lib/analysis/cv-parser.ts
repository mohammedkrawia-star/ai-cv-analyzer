/**
 * CV parsing layer.
 * Both web and native clients upload the PDF bytes to the server
 * (analyze.extractCvText), which extracts text using a multimodal LLM.
 * This keeps a single extraction path and avoids bundling pdfjs in Metro.
 * Also detects structural sections (summary, experience, education, skills)
 * for the formatting analysis without inventing anything.
 */
import type { ParsedCv } from "./types";

const SECTION_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "summary", re: /professional\s+summary|summary|profile|about\s+me/i },
  { label: "experience", re: /experience|employment|work\s+history/i },
  { label: "education", re: /education|academic|degree|university|certification/i },
  { label: "skills", re: /skills|competenc|technologies|technical/i },
  { label: "languages", re: /languages/i },
  { label: "projects", re: /projects|portfolio/i },
];

export function detectSections(text: string): string[] {
  return SECTION_PATTERNS.filter((s) => s.re.test(text)).map((s) => s.label);
}

export function cleanPdfText(raw: string): string {
  return raw
    .replace(/\u00AD/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function makeParsedCv(text: string, fileName: string): ParsedCv {
  const clean = cleanPdfText(text);
  return {
    text: clean,
    fileName,
    wordCount: clean.split(/\s+/).filter(Boolean).length,
    detectedSections: detectSections(clean),
  };
}

export function isValidPdf(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return btoa(binary);
}
