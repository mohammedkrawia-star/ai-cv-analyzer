/**
 * Before/after comparison logic.
 * Computes score deltas, progress direction, and keyword deltas between two history entries.
 * Pure module — no UI dependencies, safe to unit test.
 */
import type { CvAnalysisResult, HistoryEntry } from "./types";

export const SCORE_KEYS: ReadonlyArray<
  keyof Pick<
    CvAnalysisResult,
    | "overallScore"
    | "atsScore"
    | "skillsScore"
    | "experienceScore"
    | "keywordsScore"
    | "formattingScore"
    | "relevanceScore"
  >
> = [
  "overallScore",
  "atsScore",
  "skillsScore",
  "experienceScore",
  "keywordsScore",
  "formattingScore",
  "relevanceScore",
];

export interface ScoreDelta {
  key: (typeof SCORE_KEYS)[number];
  before: number;
  after: number;
  delta: number; // after - before
  improved: boolean;
  unchanged: boolean;
  declined: boolean;
}

export interface ComparisonDelta {
  before: HistoryEntry;
  after: HistoryEntry;
  scores: ScoreDelta[];
  addedKeywords: string[]; // keywords missing in before but still missing in after → dropped from missing list in after
  newMissingKeywords: string[];
  remainingMissing: string[];
  overallDelta: number;
  improved: boolean;
}

function asSet(items: string[] | undefined): Set<string> {
  return new Set((items ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/**
 * Compare two analyses of the *same CV* against different job targets, or a CV re-analysis.
 * `before` = earlier entry, `after` = newer entry.
 */
export function computeComparison(before: HistoryEntry, after: HistoryEntry): ComparisonDelta {
  const scores = SCORE_KEYS.map((key) => {
    const b = before.result[key];
    const a = after.result[key];
    const delta = a - b;
    return {
      key,
      before: b,
      after: a,
      delta,
      improved: delta > 0,
      unchanged: delta === 0,
      declined: delta < 0,
    };
  });

  const beforeMissing = asSet(before.result.missingKeywords);
  const afterMissing = asSet(after.result.missingKeywords);

  const addedKeywords = [...beforeMissing].filter((k) => !afterMissing.has(k));
  const newMissingKeywords = [...afterMissing].filter((k) => !beforeMissing.has(k));
  const remainingMissing = [...afterMissing].filter((k) => beforeMissing.has(k));

  const overallDelta = after.result.overallScore - before.result.overallScore;
  return {
    before,
    after,
    scores,
    addedKeywords,
    newMissingKeywords,
    remainingMissing,
    overallDelta,
    improved: overallDelta > 0,
  };
}

/** Find the best candidate `before` entry for a given newer entry:
 * prefer the most recent entry whose overall score exists; never compare with itself. */
export function pickBeforeEntry(entries: HistoryEntry[], currentId: string): HistoryEntry | null {
  const candidates = entries.filter((e) => e.id !== currentId);
  if (candidates.length === 0) return null;
  return candidates[0];
}

/** Best candidate overall: newest entry vs its best previous analysis. */
export function pickComparisonPair(
  entries: HistoryEntry[],
): { before: HistoryEntry; after: HistoryEntry } | null {
  if (entries.length < 2) return null;
  // entries are sorted newest-first; after = newest, before = oldest (first uploaded CV baseline)
  const after = entries[0];
  const before = entries[entries.length - 1];
  if (before.id === after.id) return null;
  return { before, after };
}
