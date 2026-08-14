import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

function scoreGuard(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}
function arrGuard(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 10);
}
function strGuard(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export const analyzeRouter = router({
  /**
   * Runs the full AI CV analysis against a job description.
   * Returns a guarded, well-shaped result even if the model output is imperfect.
   */
  run: publicProcedure
    .input(
      z.object({
        cvText: z.string().min(10),
        jobDescription: z.string().min(10),
        jobTitle: z.string().min(1).max(200),
      }),
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert career coach and ATS (Applicant Tracking System) specialist. Analyze a candidate's CV against a target job description.

Rules:
- Be truthful: ONLY reference skills, experience, and qualifications that actually appear in the CV. Never invent anything.
- Scores are 0-100 integers, where 100 means perfect alignment.
- Identify real keywords from the job description that are MISSING from the CV.
- Keep recommendations practical and truthful (e.g., "add relevant keywords where truthful", "quantify achievements"). Do NOT suggest adding fake certifications or experience.
- The improved summary must be based on the original summary and CV content only, targeted toward the job.

Analyze:
1. ATS compatibility: formatting, section structure, keyword usage, standard headings.
2. Skills match: compare detected CV skills against skills required by the job.
3. Experience match: relevance and depth of experience vs job requirements.
4. Keywords match: coverage of important job-description keywords.
5. Formatting: structure, readability, length, presence of key sections.
6. Relevance: overall fit for the exact role.
7. Job match: holistic probability the candidate would be shortlisted.`;

      const userPrompt = `TARGET JOB TITLE: ${input.jobTitle}

JOB DESCRIPTION:
${input.jobDescription}

CV TEXT:
${input.cvText}

Return JSON with this exact structure:
{
  "overallScore": number,
  "atsScore": number,
  "skillsScore": number,
  "experienceScore": number,
  "keywordsScore": number,
  "formattingScore": number,
  "relevanceScore": number,
  "strengths": [string],
  "weaknesses": [string],
  "matchingSkills": [string],
  "missingSkills": [string],
  "missingKeywords": [string],
  "recommendations": [string],
  "jobMatchScore": number,
  "jobMatchExplanation": string,
  "originalSummary": string,
  "improvedSummary": string
}`;

      // NOTE: do NOT use response_format json_object — on the built-in gateway it causes
      // the model response to omit the message content field entirely. We ask for JSON
      // in the prompt and strip optional markdown fences instead.
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      let raw: Record<string, unknown> = {};
      try {
        const message = response.choices[0]?.message;
        let content: unknown = message?.content;
        if (!content && typeof message === "object" && message !== null && "content" in message && !message.content) {
          // Some models reply without explicit content under structured-output flags; re-parse nothing.
        }
        if (typeof content === "string") {
          // Strip optional markdown code fences
          const cleaned = content
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          raw = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
        } else if (typeof content === "object" && content !== null) {
          raw = content as Record<string, unknown>;
        }
      } catch {
        // fall through to guard which yields safe defaults
      }

      return guardResult(raw);
    }),

  /**
   * Generates an ATS-optimized improved CV text based on the analysis result
   * and the original CV text. Applies recommendations, missing keywords, and
   * the improved summary while preserving the candidate's truthful content.
   */
  improveCv: publicProcedure
    .input(
      z.object({
        cvText: z.string().min(10),
        jobDescription: z.string().min(10),
        jobTitle: z.string().min(1).max(200),
        missingKeywords: z.array(z.string()),
        matchingSkills: z.array(z.string()),
        recommendations: z.array(z.string()),
        improvedSummary: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert resume writer and ATS (Applicant Tracking System) specialist.

Task: Rewrite a candidate's CV into a clean, ATS-friendly professional CV tailored to a target job. The output must follow this exact structure with plain text section headings in this order:

PROFESSIONAL SUMMARY
SKILLS
EXPERIENCE
EDUCATION
CERTIFICATIONS (if present in original)

Rules:
- TRUTHFULNESS IS ABSOLUTE: only use facts, skills, dates, employers, and achievements that appear in the original CV or can be truthfully inferred from it. NEVER invent jobs, degrees, certifications, or experience.
- Incorporate the missing keywords from the target job description naturally and truthfully into the summary and skills sections (only if the candidate genuinely has those skills — match them against the original CV).
- Use the provided improved professional summary.
- Rewrite bullet points to be concise, action-oriented, and quantified where the original CV already contains numbers.
- Use standard ATS-safe formatting: no tables, no columns, no graphics. Simple one-column layout in plain text.
- Keep all dates, employers, job titles, and degrees exactly as in the original CV.
- If the original CV lacks an Education or Experience section, omit those headings from the output.`;

      const userPrompt = `TARGET JOB TITLE: ${input.jobTitle}

JOB DESCRIPTION:
${input.jobDescription}

MISSING KEYWORDS TO INCORPORATE (only if truthful):
${input.missingKeywords.join(", ") || "none"}

MATCHING SKILLS (already present):
${input.matchingSkills.join(", ") || "none"}

RECOMMENDATIONS TO APPLY:
${input.recommendations.join("\n") || "none"}

IMPROVED PROFESSIONAL SUMMARY:
${input.improvedSummary}

ORIGINAL CV TEXT:
${input.cvText}

Return the full rewritten CV as plain text following the exact structure described in the system prompt.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const content = response.choices[0]?.message?.content;
      const text = typeof content === "string" ? content.trim() : "";
      if (text.length === 0) {
        throw new Error("Could not generate the improved CV");
      }
      return { cvText: text };
    }),

  /**
   * Extracts plain text from an uploaded CV PDF (for native clients).
   * Uses a multimodal LLM with file_url content to read the PDF.
   */
  extractCvText: publicProcedure
    .input(
      z.object({
        base64: z.string().min(10),
        fileName: z.string().default("cv.pdf"),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the full text of this CV/resume exactly as written. Return only the raw text, preserving section headings and order. Do not add commentary." },
              {
                type: "file_url",
                file_url: {
                  url: `data:application/pdf;base64,${input.base64}`,
                  mime_type: "application/pdf",
                },
              },
            ],
          },
        ],
      });
      const text = response.choices[0]?.message?.content;
      if (typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Could not extract text from this PDF");
      }
      return { text };
    }),
});

/** Guard helper shared with the server so both paths use one vocabulary. */
export function guardResult(raw: Record<string, unknown>) {
  return {
    overallScore: scoreGuard(raw.overallScore),
    atsScore: scoreGuard(raw.atsScore),
    skillsScore: scoreGuard(raw.skillsScore),
    experienceScore: scoreGuard(raw.experienceScore),
    keywordsScore: scoreGuard(raw.keywordsScore),
    formattingScore: scoreGuard(raw.formattingScore),
    relevanceScore: scoreGuard(raw.relevanceScore),
    strengths: arrGuard(raw.strengths),
    weaknesses: arrGuard(raw.weaknesses),
    matchingSkills: arrGuard(raw.matchingSkills),
    missingSkills: arrGuard(raw.missingSkills),
    missingKeywords: arrGuard(raw.missingKeywords),
    recommendations: arrGuard(raw.recommendations),
    jobMatchScore: scoreGuard(raw.jobMatchScore),
    jobMatchExplanation: strGuard(raw.jobMatchExplanation),
    originalSummary: strGuard(raw.originalSummary),
    improvedSummary: strGuard(raw.improvedSummary),
  };
}

export type AnalyzeRouter = typeof analyzeRouter;
