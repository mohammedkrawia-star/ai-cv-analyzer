import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Platform,
  Alert,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { ScoreRing } from "@/components/ui/score-ring";
import { ScoreBar, ProgressBar, PrimaryButton, useToast } from "@/components/ui/common";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { useAnalysis } from "@/lib/analysis/analysis-store";
import { SCORE_LABELS, scoreVerdict } from "@/lib/analysis/types";
import { useRouter } from "expo-router";
import { resultToText } from "@/lib/analysis/history-store";
import { useImproveCvMutation } from "@/lib/analysis/ai-service";
import { storeEditedCv } from "@/lib/analysis/improved-cv";

function useSummaryReplacement() {
  const { result, setResult, source } = useAnalysis();
  const [replaced, setReplaced] = useState(false);
  const t = useT();
  const toast = useToast();
  const copySummary = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result.improvedSummary);
    toast.show(t("copied"));
  };
  const useVersion = () => {
    if (!result) return;
    const next = { ...result, originalSummary: result.improvedSummary };
    setResult(next, source);
    setReplaced(true);
    toast.show(t("summaryReplaced"));
  };
  return { replaced, copySummary, useVersion };
}

export default function ResultsScreen() {
  const t = useT();
  const colors = useColors();
  const toast = useToast();
  const { result, jobTitle, source, reset } = useAnalysis();
  const router = useRouter();
  const { replaced, copySummary, useVersion } = useSummaryReplacement();
  const { cv, jobDescription } = useAnalysis();
  const improveCv = useImproveCv();
  const [improvedCv, setImprovedCv] = useState<string | null>(null);
  const [cvPreviewId, setCvPreviewId] = useState<number | null>(null);
  const [generatingCv, setGeneratingCv] = useState(false);
  const [cvGenError, setCvGenError] = useState<string | null>(null);

  if (!result) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.center}>
          <IconSymbol name="doc.text.fill" size={44} color={colors.muted} />
          <Text style={styles.centerText}>No analysis yet.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const copyKeywords = async () => {
    await Clipboard.setStringAsync(result.missingKeywords.join(", "));
    toast.show(t("copied"));
  };

  const copyResults = async () => {
    await Clipboard.setStringAsync(resultToText({ jobTitle, result }));
    toast.show(t("copied"));
  };

  const shareResult = async () => {
    if (!result) return;
    const text = resultToText({ jobTitle, result });
    if (Platform.OS === "web") {
      // Web: share via the Web Share API when available, otherwise clipboard.
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: t("shareTitle").replace("{jobTitle}", jobTitle),
            text,
          });
          return;
        } catch {
          /* user cancelled or unsupported */
        }
      }
      await Clipboard.setStringAsync(text);
      toast.show(t("copied"));
      return;
    }
    // Native: share text via the system share sheet.
    try {
      await Share.share({
        message: text,
        title: t("shareTitle").replace("{jobTitle}", jobTitle),
      });
    } catch {
      /* user cancelled */
    }
  };

  const generateImprovedCv = async () => {
    if (!result || !cv) return;
    setGeneratingCv(true);
    setCvGenError(null);
    try {
      const improved = await improveCv({
        cvText: cv.text,
        jobDescription,
        jobTitle,
        result,
      });
      setImprovedCv(improved);
      setCvPreviewId(storeEditedCv(improved));
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      toast.show(t("improvedCvReady"));
    } catch {
      setCvGenError(t("improvedCvError"));
      toast.show(t("improvedCvError"));
    } finally {
      setGeneratingCv(false);
    }
  };

  const copyImprovedCv = async () => {
    if (!improvedCv) return;
    await Clipboard.setStringAsync(improvedCv);
    toast.show(t("copied"));
  };

  const downloadImprovedCv = () => {
    if (!improvedCv) return;
    if (Platform.OS === "web") {
      const html = buildImprovedCvHtml({ jobTitle, cvText: improvedCv });
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      let opened = false;
      try {
        const win = window.open(url, "_blank");
        if (win) {
          opened = true;
          win.onload = () => {
            setTimeout(() => {
              try {
                win.print();
              } catch {
                /* ignore */
              }
            }, 300);
          };
        }
      } catch {
        /* ignore */
      }
      if (opened) {
        toast.show(t("improvedCvReady"));
      } else {
        void Clipboard.setStringAsync(improvedCv).then(() =>
          toast.show(t("pdfBlockedFallback")),
        );
      }
    } else {
      Alert.alert(t("improvedCvDownload"), improvedCv);
    }
  };

  const downloadPdf = () => {
    if (Platform.OS === "web") {
      const html = buildReportHtml({ jobTitle, result });
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      let opened = false;
      try {
        const win = window.open(url, "_blank");
        if (win) {
          opened = true;
          win.onload = () => {
            setTimeout(() => {
              try {
                win.print();
              } catch {
                /* ignore */
              }
            }, 300);
          };
        }
      } catch {
        /* ignore */
      }
      if (opened) {
        toast.show(t("pdfReady"));
      } else {
        // Popup was blocked — fall back to copying the full report text.
        void Clipboard.setStringAsync(resultToText({ jobTitle, result })).then(() =>
          toast.show(t("pdfBlockedFallback")),
        );
      }
    } else {
      Alert.alert(t("downloadPdf"), resultToText({ jobTitle, result }));
    }
  };

  const sectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}>
        <Text style={styles.jobTitle}>{jobTitle}</Text>
        <Text style={styles.resultsHeading}>{t("resultsTitle")}</Text>

        {/* Overall score */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ScoreRing score={result.overallScore} size={150} strokeWidth={12} label={t("cvScore")} />
          <Text style={styles.verdict}>{scoreVerdict(result.overallScore)}</Text>
          {source === "fallback" ? (
            <Text style={styles.fallbackNote}>{t("fallbackNote")}</Text>
          ) : null}
          <Text style={styles.explanationTitle}>{t("scoreExplanation")}</Text>
          <Text style={styles.explanationText}>{generateExplanation(result)}</Text>
        </View>

        {/* Category scores */}
        {sectionTitle(t("categoryScores"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ScoreBar label={SCORE_LABELS.atsScore} score={result.atsScore} />
          <ScoreBar label={SCORE_LABELS.skillsScore} score={result.skillsScore} />
          <ScoreBar label={SCORE_LABELS.experienceScore} score={result.experienceScore} />
          <ScoreBar label={SCORE_LABELS.keywordsScore} score={result.keywordsScore} />
          <ScoreBar label={SCORE_LABELS.formattingScore} score={result.formattingScore} />
          <ScoreBar label={SCORE_LABELS.relevanceScore} score={result.relevanceScore} />
        </View>

        {/* Job match */}
        {sectionTitle(t("jobMatch"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.matchRow}>
            <Text style={styles.matchLabel}>{t("jobMatch")}: {result.jobMatchScore}%</Text>
          </View>
          <ProgressBar percent={result.jobMatchScore} />
          <Text style={styles.explanationText}>{result.jobMatchExplanation}</Text>
        </View>

        {/* Strengths */}
        {sectionTitle(t("strengths"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {result.strengths.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <IconSymbol name="checkmark.seal.fill" size={18} color={colors.success} />
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Weaknesses */}
        {sectionTitle(t("weaknesses"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {result.weaknesses.map((w, i) => (
            <View key={i} style={styles.listRow}>
              <IconSymbol name="xmark.seal.fill" size={18} color={colors.warning} />
              <Text style={styles.listText}>{w}</Text>
            </View>
          ))}
        </View>

        {/* Missing keywords */}
        {sectionTitle(t("missingKeywords"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.tags}>
            {result.missingKeywords.map((k, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{k}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton
            title={t("copyKeywords")}
            onPress={copyKeywords}
            variant="outline"
          />
        </View>

        {/* Skills comparison */}
        {sectionTitle(t("skillsComparison"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={styles.colTitle}>{t("skillsRequired")}</Text>
          {result.missingSkills.length === 0 ? (
            <Text style={styles.emptyText}>{result.matchingSkills.length ? t("noSkillsFound") : t("noJobSkills")}</Text>
          ) : (
            <View style={styles.tagList}>
              {result.missingSkills.map((s, i) => (
                <View key={i} style={[styles.tagWarn, { backgroundColor: `${colors.warning}18` }]}>
                  <Text style={[styles.tagText, { color: colors.warning }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.colTitle, { marginTop: 14 }]}>{t("skillsFound")}</Text>
          {result.matchingSkills.length === 0 ? (
            <Text style={styles.emptyText}>{t("noSkillsFound")}</Text>
          ) : (
            <View style={styles.tagList}>
              {result.matchingSkills.map((s, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: `${colors.success}18` }]}>
                  <Text style={[styles.tagText, { color: colors.success }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recommendations */}
        {sectionTitle(t("howToImprove"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {result.recommendations.map((r, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.recNumber}>{i + 1}</Text>
              <Text style={styles.listText}>{r}</Text>
            </View>
          ))}
        </View>

        {/* Professional summary */}
        {sectionTitle(t("improveSummary"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={styles.colTitle}>{t("originalSummary")}</Text>
          <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={styles.summaryText}>
              {result.originalSummary || t("noSummaryFound")}
            </Text>
          </View>
          <Text style={[styles.colTitle, { marginTop: 14 }]}>{t("improvedSummary")}</Text>
          <View style={[styles.summaryBox, { backgroundColor: `${colors.primary}08`, borderColor: colors.primary }]}>
            <Text style={styles.summaryText}>{result.improvedSummary}</Text>
          </View>
          <View style={styles.summaryButtons}>
            <PrimaryButton title={t("copySummary")} onPress={copySummary} variant="outline" />
            <View style={{ height: 10 }} />
            <PrimaryButton title={t("useThisVersion")} onPress={useVersion} disabled={replaced} />
          </View>
        </View>

        {/* Before / After */}
        {sectionTitle(t("beforeAfter"))}
        <View style={styles.baRow}>
          <View style={[styles.baCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.baLabel, { color: colors.muted }]}>{t("before")}</Text>
            <Text style={styles.baText} numberOfLines={8} ellipsizeMode="tail">
              {result.originalSummary || t("noSummaryFound")}
            </Text>
          </View>
          <View style={[styles.baCard, { borderColor: colors.success, backgroundColor: colors.surface }]}>
            <Text style={[styles.baLabel, { color: colors.success }]}>{t("after")}</Text>
            <Text style={styles.baText} numberOfLines={8} ellipsizeMode="tail">
              {result.improvedSummary}
            </Text>
          </View>
        </View>

        {/* Export */}
        {sectionTitle(t("exportReport"))}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <PrimaryButton title={t("downloadPdf")} onPress={downloadPdf} />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title={t("shareResult")}
            icon="square.and.arrow.up"
            onPress={shareResult}
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title={t("generateImprovedCv")}
            icon="document.badge.gearshape"
            loading={generatingCv}
            disabled={generatingCv}
            onPress={generateImprovedCv}
          />
          {cvGenError ? (
            <Text style={{ fontSize: 12, color: "#F59E0B", textAlign: "center", marginTop: 8 }}>
              {cvGenError}
            </Text>
          ) : null}
          {improvedCv ? (
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 17, marginBottom: 8 }}>
                {t("improvedCvNote")}
              </Text>
              <PrimaryButton
                title={t("previewAndEditCv")}
                icon="eye.fill"
                onPress={() => {
                  if (cvPreviewId === null) return;
                  router.push({ pathname: "/(analyze)/cv-preview", params: { id: String(cvPreviewId) } });
                }}
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title={t("downloadImprovedCvPdf")}
                icon="arrow.down.to.line"
                onPress={downloadImprovedCv}
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title={t("copyImprovedCv")}
                onPress={copyImprovedCv}
                variant="outline"
              />
            </View>
          ) : null}
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("copyResults")} onPress={copyResults} variant="outline" />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title={t("analyzeAnother")}
            variant="outline"
            onPress={() => {
              reset();
              router.replace("/(tabs)");
            }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Server path: uses the AI to rewrite the CV in an ATS-friendly format.
 */
function useImproveCv() {
  const improveMutation = useImproveCvMutation();
  return async (entry: {
    cvText: string;
    jobDescription: string;
    jobTitle: string;
    result: import("@/lib/analysis/types").CvAnalysisResult;
  }): Promise<string> => {
    try {
      const resp = await improveMutation.mutateAsync({
        cvText: entry.cvText,
        jobDescription: entry.jobDescription,
        jobTitle: entry.jobTitle,
        missingKeywords: entry.result.missingKeywords,
        matchingSkills: entry.result.matchingSkills,
        recommendations: entry.result.recommendations,
        improvedSummary: entry.result.improvedSummary,
      });
      if (typeof resp.cvText === "string" && resp.cvText.trim().length > 50) {
        return resp.cvText.trim();
      }
    } catch {
      /* fall back to local rebuild */
    }
    // Local fallback: rebuild an ATS-friendly CV from the analysis without inventing content.
    return buildLocalImprovedCv(entry);
  };
}

/**
 * Deterministic local rebuild of the CV: keeps original CV content intact,
 * prepends the improved summary and a merged skills section so the CV is
 * truthful (never invents experience, dates, or degrees).
 */
function buildLocalImprovedCv(entry: {
  cvText: string;
  jobTitle: string;
  result: import("@/lib/analysis/types").CvAnalysisResult;
}): string {
  const { cvText, jobTitle, result } = entry;
  const parts: string[] = [];
  parts.push(`PROFESSIONAL SUMMARY`);
  parts.push(result.improvedSummary || `A targeted professional summary for ${jobTitle} based on the candidate's experience.`);
  parts.push("");
  const allSkills = Array.from(new Set([...result.matchingSkills, ...result.missingKeywords]));
  if (allSkills.length > 0) {
    parts.push(`SKILLS`);
    parts.push(allSkills.join(", "));
    parts.push("");
  }
  parts.push(`EXPERIENCE`);
  parts.push(cvText);
  return parts.join("\n");
}

function generateExplanation(r: { overallScore: number; atsScore: number; skillsScore: number; keywordsScore: number; strengths: string[]; weaknesses: string[] }): string {
  const verdict = scoreVerdict(r.overallScore);
  const top = r.strengths[0] ?? "your foundational experience";
  const gap = r.weaknesses[0] ?? "alignment with the target role";
  return `Your CV scored ${r.overallScore}/100 (${verdict}). ${top} ${gap ? `The main area to address is: ${gap}` : ""} Improving keyword coverage and quantified achievements would move your score higher.`;
}

function buildImprovedCvHtml(entry: { jobTitle: string; cvText: string }): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = escapeHtml(entry.cvText)
    .split("\n")
    .map((line) => {
      const t2 = line.trim();
      const heading =
        /^\s*(PROFESSIONAL SUMMARY|SKILLS|EXPERIENCE|EDUCATION|CERTIFICATIONS)\s*$/i.test(t2);
      if (heading) {
        return `<div class="h2">${t2}</div>`;
      }
      if (t2.length === 0) return "<br/>";
      return `<p>${t2}</p>`;
    })
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Improved CV — ${escapeHtml(entry.jobTitle)}</title>
<style>
body{font-family:Helvetica,Arial,sans-serif;max-width:700px;margin:32px auto;color:#111827;line-height:1.55;font-size:14px}
h1{font-size:20px;margin-bottom:2px}.h2{font-size:13px;font-weight:800;margin-top:18px;color:#4F46E5;text-transform:uppercase;letter-spacing:1;border-bottom:1px solid #E5E7EB;padding-bottom:4px}
p{margin:3px 0}
@media print{body{margin:16px auto}}
</style></head><body>
<h1>${escapeHtml(entry.jobTitle)}</h1>
${body}
</body></html>`;
}

function buildReportHtml(entry: { jobTitle: string; result: import("@/lib/analysis/types").CvAnalysisResult }): string {
  const r = entry.result;
  const rows = (arr: string[]) => arr.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CV Analysis — ${escapeHtml(entry.jobTitle)}</title>
<style>
body{font-family:Helvetica,Arial,sans-serif;max-width:720px;margin:24px auto;color:#111827;line-height:1.5}
h1{font-size:22px}.h2{font-size:15px;font-weight:700;margin-top:22px;color:#4F46E5}
.score{font-size:30px;font-weight:800}ul{margin:6px 0 0 20px;padding:0}li{margin-bottom:4px}
table{border-collapse:collapse;width:100%;margin-top:8px}td{border:1px solid #E5E7EB;padding:6px 10px;font-size:13px}
</style></head><body>
<h1>AI CV Analysis — ${escapeHtml(entry.jobTitle)}</h1>
<p>Date: ${new Date().toLocaleString()}</p>
<p class="score">CV Score: ${r.overallScore}/100</p>
<div class="h2">Category Scores</div>
<table><tr><td>ATS: ${r.atsScore}</td><td>Skills: ${r.skillsScore}</td><td>Experience: ${r.experienceScore}</td></tr>
<tr><td>Keywords: ${r.keywordsScore}</td><td>Formatting: ${r.formattingScore}</td><td>Relevance: ${r.relevanceScore}</td></tr></table>
<div class="h2">Job Match: ${r.jobMatchScore}%</div><p>${escapeHtml(r.jobMatchExplanation)}</p>
<div class="h2">Strengths</div><ul>${rows(r.strengths)}</ul>
<div class="h2">Weaknesses</div><ul>${rows(r.weaknesses)}</ul>
<div class="h2">Missing Keywords</div><ul>${rows(r.missingKeywords)}</ul>
<div class="h2">Skills Comparison</div>
<p><b>Matching:</b> ${r.matchingSkills.join(", ") || "none"}</p>
<p><b>Missing:</b> ${r.missingSkills.join(", ") || "none"}</p>
<div class="h2">Recommendations</div><ul>${rows(r.recommendations)}</ul>
<div class="h2">Improved Professional Summary</div><p>${escapeHtml(r.improvedSummary)}</p>
</body></html>`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  centerText: { fontSize: 15, color: "#6B7280", lineHeight: 22 },
  jobTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  resultsHeading: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 6,
  },
  verdict: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    color: "#111827",
  },
  fallbackNote: {
    fontSize: 12,
    lineHeight: 17,
    color: "#F59E0B",
    textAlign: "center",
    marginTop: 6,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    color: "#111827",
    marginTop: 16,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    color: "#111827",
    marginTop: 22,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  recNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
    overflow: "hidden",
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagWarn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  colTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 19,
    color: "#111827",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#9CA3AF",
    marginTop: 4,
  },
  matchRow: { marginBottom: 10 },
  matchLabel: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 26,
    color: "#111827",
  },
  summaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
  },
  summaryButtons: { marginTop: 14 },
  baRow: {
    flexDirection: "row",
    gap: 10,
  },
  baCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  baLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 15,
    marginBottom: 6,
  },
  baText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#374151",
  },
});
