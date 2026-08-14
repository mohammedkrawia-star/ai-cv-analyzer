import { describe, expect, it } from "vitest";
import { analyzeCvFallback } from "../lib/analysis/fallback-analyzer";
import { guardResult } from "../lib/analysis/result-guard";
import { detectSections, cleanPdfText, isValidPdf } from "../lib/analysis/cv-parser";
import { scoreVerdict } from "../lib/analysis/types";

const sampleCv = `
JOHN DOE
Senior Software Engineer
john@example.com

PROFESSIONAL SUMMARY
Software engineer with 6 years of experience building web applications using React,
Node.js, and PostgreSQL. Led a team of 4 engineers and improved CI pipeline speed by 40%.

EXPERIENCE
Senior Software Engineer, Acme Inc. (2020 - 2024)
- Built REST APIs serving 1M+ requests/day using Node.js and Express
- Migrated monolith to microservices on AWS (EC2, S3, RDS)
- Mentored 3 junior developers

EDUCATION
B.S. Computer Science, State University

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, CI/CD, Agile
`.trim();

describe("cv-parser", () => {
  it("detects standard CV sections", () => {
    const sections = detectSections(sampleCv);
    expect(sections).toContain("summary");
    expect(sections).toContain("experience");
    expect(sections).toContain("education");
    expect(sections).toContain("skills");
  });

  it("cleans messy PDF text", () => {
    const cleaned = cleanPdfText("a\u00AD  b    c\n\n\n\nd");
    expect(cleaned).not.toContain("\u00AD");
    expect(cleaned).toContain("a");
    expect(cleaned).toContain("d");
    // "a b c\n\nd\n" or "a b c\n\nd" — either way at most 3 segments and no 3+ consecutive newlines
    expect(cleaned.split("\n").length).toBeLessThanOrEqual(3);
    expect(cleaned).not.toMatch(/\n{3,}/);
  });

  it("validates PDF magic bytes", () => {
    expect(isValidPdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true);
    expect(isValidPdf(new Uint8Array([0x3c, 0x68, 0x74, 0x6d]))).toBe(false);
    expect(isValidPdf(new Uint8Array([]))).toBe(false);
  });
});

describe("scoreVerdict", () => {
  it("maps score ranges to verdicts", () => {
    expect(scoreVerdict(85)).toBe("Excellent");
    expect(scoreVerdict(70)).toBe("Good");
    expect(scoreVerdict(50)).toBe("Fair");
    expect(scoreVerdict(30)).toBe("Needs Work");
  });
});

describe("fallback analyzer", () => {
  const input = {
    cvText: sampleCv,
    jobDescription:
      "We need a Senior Software Engineer with 5+ years experience in React, Node.js, PostgreSQL, AWS, Docker, Kubernetes, and CI/CD pipelines. Must have led teams and shipped microservices.",
    jobTitle: "Senior Software Engineer",
  };

  it("produces a guarded result with realistic ranges", async () => {
    const result = await analyzeCvFallback(input);
    expect(result.overallScore).toBeGreaterThanOrEqual(25);
    expect(result.overallScore).toBeLessThanOrEqual(95);
    expect(result.matchingSkills.length).toBeGreaterThan(0);
    expect(result.missingSkills.some((s) => s.toLowerCase().includes("kubernetes"))).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.improvedSummary.length).toBeGreaterThan(10);
    expect(result.jobMatchExplanation.length).toBeGreaterThan(0);
  });

  it("never invents skills not present in the CV", async () => {
    const result = await analyzeCvFallback(input);
    for (const s of result.matchingSkills) {
      const lower = sampleCv.toLowerCase();
      expect(lower.includes(s.toLowerCase())).toBe(true);
    }
  });

  it("returns low scores for a nearly empty CV", async () => {
    const result = await analyzeCvFallback({
      cvText: "Jane Doe. Some skills.",
      jobDescription:
        "Looking for an experienced data scientist with Python, TensorFlow, SQL, and 5 years of ML experience.",
      jobTitle: "Data Scientist",
    });
    expect(result.overallScore).toBeLessThan(45);
    expect(result.strengths.length).toBeLessThanOrEqual(2);
  });
});

describe("result guard", () => {
  it("coerces malformed payloads safely", () => {
    const guarded = guardResult({
      overallScore: 150,
      strengths: [null, "", 42, " real strength "],
      missingKeywords: "not-an-array",
    } as unknown as Record<string, unknown>);
    expect(guarded.overallScore).toBe(100);
    expect(guarded.strengths).toEqual(["real strength"]);
    expect(guarded.missingKeywords).toEqual([]);
    expect(guarded.improvedSummary).toBe("");
  });

  it("handles completely empty payload", () => {
    const guarded = guardResult({});
    expect(guarded.overallScore).toBe(0);
    expect(guarded.strengths).toEqual([]);
    expect(guarded.recommendations).toEqual([]);
  });
});
