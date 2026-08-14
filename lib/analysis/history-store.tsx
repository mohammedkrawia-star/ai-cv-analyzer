/**
 * Local analysis history backed by AsyncStorage.
 * Exposed via React context so any screen can read/append/delete entries.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CvAnalysisResult, HistoryEntry } from "./types";

const KEY = "aicv.history.v1";
const MAX_ENTRIES = 20;

interface HistoryContextValue {
  entries: HistoryEntry[];
  loading: boolean;
  addEntry: (entry: Omit<HistoryEntry, "id" | "date">) => void;
  removeEntry: (id: string) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setEntries(JSON.parse(raw) as HistoryEntry[]);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: HistoryEntry[]) => {
    setEntries(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const addEntry = useCallback((entry: Omit<HistoryEntry, "id" | "date">) => {
    setEntries((prev) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
      };
      const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
        /* ignore */
      });
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
        /* ignore */
      });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ entries, loading, addEntry, removeEntry }),
    [entries, loading, addEntry, removeEntry],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}

/** Lightweight helper to produce a Markdown text copy of a result. */
export function resultToText(entry: {
  jobTitle: string;
  result: CvAnalysisResult;
  date?: string;
}): string {
  const r = entry.result;
  return [
    `# AI CV Analysis — ${entry.jobTitle}`,
    entry.date ? `Date: ${new Date(entry.date).toLocaleString()}` : "",
    "",
    `**Overall Score: ${r.overallScore}/100**`,
    "",
    "## Category Scores",
    `- ATS: ${r.atsScore}/100`,
    `- Skills: ${r.skillsScore}/100`,
    `- Experience: ${r.experienceScore}/100`,
    `- Keywords: ${r.keywordsScore}/100`,
    `- Formatting: ${r.formattingScore}/100`,
    `- Relevance: ${r.relevanceScore}/100`,
    "",
    `## Job Match: ${r.jobMatchScore}%`,
    r.jobMatchExplanation,
    "",
    "## Strengths",
    ...r.strengths.map((s) => `- ${s}`),
    "",
    "## Weaknesses",
    ...r.weaknesses.map((s) => `- ${s}`),
    "",
    "## Missing Keywords",
    ...r.missingKeywords.map((k) => `- ${k}`),
    "",
    "## Skills Comparison",
    `- Matching: ${r.matchingSkills.join(", ") || "none"}`,
    `- Missing: ${r.missingSkills.join(", ") || "none"}`,
    "",
    "## Recommendations",
    ...r.recommendations.map((s) => `- ${s}`),
    "",
    "## Improved Professional Summary",
    r.improvedSummary,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}
