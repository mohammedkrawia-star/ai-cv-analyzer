/**
 * Shared guard that normalizes a raw (possibly imperfect) AI payload into
 * a well-shaped CvAnalysisResult so downstream UI never crashes.
 * Kept free of framework/RN imports so it stays unit-testable in node.
 */
import type { CvAnalysisResult } from "./types";

function strGuard(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function sanitizeScore(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function sanitizeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 10);
}

export function guardResult(raw: Record<string, unknown>): CvAnalysisResult {
  const num = (k: string) => sanitizeScore(raw[k]);
  const arr = (k: string) => sanitizeStringArray(raw[k]);
  const str = (k: string) => strGuard(raw[k]);
  return {
    overallScore: num("overallScore"),
    atsScore: num("atsScore"),
    skillsScore: num("skillsScore"),
    experienceScore: num("experienceScore"),
    keywordsScore: num("keywordsScore"),
    formattingScore: num("formattingScore"),
    relevanceScore: num("relevanceScore"),
    strengths: arr("strengths"),
    weaknesses: arr("weaknesses"),
    matchingSkills: arr("matchingSkills"),
    missingSkills: arr("missingSkills"),
    missingKeywords: arr("missingKeywords"),
    recommendations: arr("recommendations"),
    jobMatchScore: num("jobMatchScore"),
    jobMatchExplanation: str("jobMatchExplanation"),
    originalSummary: str("originalSummary"),
    improvedSummary: str("improvedSummary"),
  };
}
