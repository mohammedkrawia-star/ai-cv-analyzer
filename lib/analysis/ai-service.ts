/**
 * AI service layer.
 * Isolated interface so a different model/API can be plugged in later
 * without redesigning the app.
 *
 * Primary path: server LLM (tRPC analyze.run mutation via useMutation hook).
 * Fallback path: deterministic keyword/structure analyzer (always works).
 */
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import type { AnalysisInput, CvAnalysisResult } from "./types";
import { guardResult } from "./result-guard";

export function useAnalyzeMutation() {
  return trpc.analyze.run.useMutation();
}

export function useExtractCvTextMutation() {
  return trpc.analyze.extractCvText.useMutation();
}

export function useImproveCvMutation() {
  return trpc.analyze.improveCv.useMutation();
}

export async function runFallbackAnalysis(input: AnalysisInput): Promise<CvAnalysisResult> {
  const { analyzeCvFallback } = await import("./fallback-analyzer");
  await new Promise((r) => setTimeout(r, 900));
  return analyzeCvFallback(input);
}

export { guardResult };
export type { CvAnalysisResult, AnalysisInput };
