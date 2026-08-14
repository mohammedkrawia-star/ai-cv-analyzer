/**
 * Shared analysis domain types.
 * Kept UI-agnostic so the AI service, parser, and history layers all share one vocabulary.
 */

export interface CvAnalysisResult {
  overallScore: number;
  atsScore: number;
  skillsScore: number;
  experienceScore: number;
  keywordsScore: number;
  formattingScore: number;
  relevanceScore: number;
  strengths: string[];
  weaknesses: string[];
  matchingSkills: string[];
  missingSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
  jobMatchScore: number;
  jobMatchExplanation: string;
  originalSummary: string;
  improvedSummary: string;
}

export interface AnalysisInput {
  cvText: string;
  jobDescription: string;
  jobTitle: string;
}

export interface HistoryEntry {
  id: string;
  jobTitle: string;
  overallScore: number;
  date: string; // ISO timestamp
  fileName?: string;
  input: AnalysisInput;
  result: CvAnalysisResult;
}

export interface ParsedCv {
  text: string;
  fileName: string;
  wordCount: number;
  detectedSections: string[];
}

export const SCORE_LABELS: Record<
  keyof Pick<
    CvAnalysisResult,
    | "overallScore"
    | "atsScore"
    | "skillsScore"
    | "experienceScore"
    | "keywordsScore"
    | "formattingScore"
    | "relevanceScore"
  >,
  string
> = {
  overallScore: "Overall",
  atsScore: "ATS",
  skillsScore: "Skills",
  experienceScore: "Experience",
  keywordsScore: "Keywords",
  formattingScore: "Formatting",
  relevanceScore: "Relevance",
};

/** Returns a human-friendly verdict for a 0-100 score. */
export function scoreVerdict(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Fair";
  return "Needs Work";
}
