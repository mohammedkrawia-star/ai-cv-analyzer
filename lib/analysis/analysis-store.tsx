/**
 * Cross-screen analysis session state.
 * Holds the current CV text, job description, target title, result,
 * and analysis source (ai | fallback).
 */
import React, { createContext, useContext, useState } from "react";
import type { CvAnalysisResult, ParsedCv } from "./types";

interface AnalysisSession {
  cv: ParsedCv | null;
  jobTitle: string;
  jobDescription: string;
  result: CvAnalysisResult | null;
  source: "ai" | "fallback";
  setCv: (cv: ParsedCv | null) => void;
  setJob: (jobTitle: string, jobDescription: string) => void;
  setResult: (result: CvAnalysisResult, source: "ai" | "fallback") => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisSession | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [cv, setCv] = useState<ParsedCv | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResultState] = useState<CvAnalysisResult | null>(null);
  const [source, setSource] = useState<"ai" | "fallback">("ai");

  const setJob = (jt: string, jd: string) => {
    setJobTitle(jt);
    setJobDescription(jd);
  };

  const setResult = (r: CvAnalysisResult, s: "ai" | "fallback") => {
    setResultState(r);
    setSource(s);
  };

  const reset = () => {
    setCv(null);
    setJobTitle("");
    setJobDescription("");
    setResultState(null);
    setSource("ai");
  };

  return (
    <AnalysisContext.Provider
      value={{ cv, jobTitle, jobDescription, result, source, setCv, setJob, setResult, reset }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis(): AnalysisSession {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
