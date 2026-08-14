import { describe, expect, it } from "vitest";
import {
  computeComparison,
  pickBeforeEntry,
  pickComparisonPair,
} from "../lib/analysis/comparison";
import type { HistoryEntry } from "../lib/analysis/types";

function entry(
  id: string,
  jobTitle: string,
  scores: Partial<Record<string, number>>,
  missingKeywords: string[] = [],
): HistoryEntry {
  return {
    id,
    jobTitle,
    overallScore: scores.overallScore ?? 50,
    date: new Date().toISOString(),
    input: { cvText: "", jobDescription: "", jobTitle },
    result: {
      overallScore: scores.overallScore ?? 50,
      atsScore: scores.atsScore ?? 50,
      skillsScore: scores.skillsScore ?? 50,
      experienceScore: scores.experienceScore ?? 50,
      keywordsScore: scores.keywordsScore ?? 50,
      formattingScore: scores.formattingScore ?? 50,
      relevanceScore: scores.relevanceScore ?? 50,
      strengths: [],
      weaknesses: [],
      matchingSkills: [],
      missingSkills: [],
      missingKeywords,
      recommendations: [],
      jobMatchScore: 50,
      jobMatchExplanation: "",
      originalSummary: "",
      improvedSummary: "",
    } as HistoryEntry["result"],
  };
}

describe("computeComparison", () => {
  it("computes score deltas with direction flags", () => {
    const before = entry("b", "Job A", { overallScore: 40, atsScore: 30, skillsScore: 60 });
    const after = entry("a", "Job B", { overallScore: 55, atsScore: 30, skillsScore: 45 });
    const d = computeComparison(before, after);
    expect(d.overallDelta).toBe(15);
    expect(d.improved).toBe(true);
    const ats = d.scores.find((s) => s.key === "atsScore")!;
    expect(ats.unchanged).toBe(true);
    const skills = d.scores.find((s) => s.key === "skillsScore")!;
    expect(skills.declined).toBe(true);
  });

  it("computes keyword deltas: gained / new missing / remaining", () => {
    const before = entry("b", "Job A", {}, ["react", "docker", "sql"]);
    const after = entry("a", "Job B", {}, ["docker", "graphql", "aws"]);
    const d = computeComparison(before, after);
    expect(d.addedKeywords.sort()).toEqual(["react", "sql"]);
    expect(d.newMissingKeywords.sort()).toEqual(["aws", "graphql"]);
    expect(d.remainingMissing).toEqual(["docker"]);
  });

  it("handles empty keyword lists", () => {
    const before = entry("b", "A", {}, []);
    const after = entry("a", "B", {}, []);
    const d = computeComparison(before, after);
    expect(d.addedKeywords).toEqual([]);
    expect(d.newMissingKeywords).toEqual([]);
    expect(d.remainingMissing).toEqual([]);
  });

  it("ignores whitespace/case in keyword comparison", () => {
    const before = entry("b", "A", {}, ["  React ", "DOCKER"]);
    const after = entry("a", "B", {}, ["react", "docker"]);
    const d = computeComparison(before, after);
    expect(d.addedKeywords).toEqual([]);
    expect(d.remainingMissing.sort()).toEqual(["docker", "react"]);
  });
});

describe("pair selection", () => {
  it("picks newest vs oldest entries", () => {
    const entries = [entry("2", "Newest", { overallScore: 70 }), entry("1", "Oldest", { overallScore: 40 })];
    const pair = pickComparisonPair(entries);
    expect(pair?.after.id).toBe("2");
    expect(pair?.before.id).toBe("1");
  });

  it("returns null with fewer than two entries", () => {
    expect(pickComparisonPair([])).toBeNull();
    expect(pickComparisonPair([entry("1", "A", {})])).toBeNull();
  });

  it("pickBeforeEntry never returns the current entry", () => {
    const entries = [entry("x", "A", {}), entry("y", "B", {})];
    expect(pickBeforeEntry(entries, "x")?.id).toBe("y");
  });

  it("pickBeforeEntry picks the most recent candidate (entries newest-first)", () => {
    const entries = [entry("4", "D", {}), entry("3", "C", {}), entry("2", "B", {}), entry("1", "A", {})];
    expect(pickBeforeEntry(entries, "4")?.id).toBe("3");
    expect(pickBeforeEntry(entries, "2")?.id).toBe("4");
  });

  it("pickBeforeEntry returns null with no other entries", () => {
    expect(pickBeforeEntry([], "x")).toBeNull();
    expect(pickBeforeEntry([entry("x", "A", {})], "x")).toBeNull();
  });
});
