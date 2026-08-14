import React from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/common";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { useHistory } from "@/lib/analysis/history-store";
import { useLocalSearchParams } from "expo-router";
import { computeComparison, pickBeforeEntry, pickComparisonPair, type ScoreDelta } from "@/lib/analysis/comparison";
import { SCORE_LABELS } from "@/lib/analysis/types";

/**
 * Comparison screen: latest analysis vs first analysis (before/after progress).
 * Shows per-category score deltas, overall progress, and keyword gaps.
 */
export default function CompareScreen() {
  const t = useT();
  const colors = useColors();
  const { entries } = useHistory();
  const params = useLocalSearchParams<{ currentId?: string }>();

  // If launched from a specific history card ("Compare with this"), compare that
  // entry against its previous analysis. Otherwise compare newest vs oldest.
  const pair = (() => {
    const currentId = params.currentId;
    if (currentId) {
      const after = entries.find((e) => e.id === currentId) ?? null;
      const before = after ? pickBeforeEntry(entries, after.id) : null;
      if (before && after) return { before, after };
    }
    return pickComparisonPair(entries);
  })();

  if (!pair) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.center}>
          <IconSymbol name="scale.3d" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>{t("compareTitle")}</Text>
          <Text style={styles.emptyDesc}>{t("compareDisabled")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const delta = computeComparison(pair.before, pair.after);
  const overall = delta.scores.find((s) => s.key === "overallScore")!;
  const details = delta.scores.filter((s) => s.key !== "overallScore");

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>{t("compareTitle")}</Text>
        <Text style={styles.subtitle}>{t("comparisonNote")}</Text>

        {/* Overall progress card */}
        <View style={[styles.overallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.overallHead}>
            <View>
              <Text style={styles.overallLabel}>{t("cvScore")}</Text>
              <View style={styles.overallScores}>
                <Text style={[styles.overallValue, { color: colors.muted }]}>{overall.before}</Text>
                <IconSymbol
                  name={overall.improved ? "chart.line.uptrend.xyaxis" : overall.declined ? "arrow.down.right" : "equal.circle.fill"}
                  size={24}
                  color={overall.improved ? colors.success : overall.declined ? colors.error : colors.muted}
                />
                <Text
                  style={[
                    styles.overallValue,
                    { color: overall.improved ? colors.success : overall.declined ? colors.error : colors.muted },
                  ]}
                >
                  {overall.after}
                </Text>
              </View>
            </View>
            <View style={styles.overallDelta}>
              <Text
                style={[
                  styles.overallDeltaText,
                  { color: overall.improved ? colors.success : overall.declined ? colors.error : colors.muted },
                ]}
              >
                {overall.delta > 0 ? "+" : ""}
                {overall.delta} {t("deltaPoints")}
              </Text>
              <Text style={[styles.overallDeltaSub, { color: colors.muted }]}>
                {overall.improved ? t("scoreImproved") : overall.declined ? t("scoreDeclined") : t("scoreUnchanged")}
              </Text>
            </View>
          </View>
          <ProgressBar percent={overall.after} height={10} />
        </View>

        {/* Category scores before/after */}
        <Text style={styles.sectionTitle}>{t("categoryScores")}</Text>
        <View style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.catHeader}>
            <Text style={styles.catHeaderLabel}>{t("before")}</Text>
            <Text style={styles.catHeaderLabel}>{t("after")}</Text>
          </View>
          {details.map((s) => (
            <ScoreRow key={s.key} delta={s} t={t as (k: string) => string} colors={colors} label={SCORE_LABELS[s.key]} />
          ))}
        </View>

        {/* Keywords gained */}
        <View style={[styles.kwCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.kwHead}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.kwTitle}>{t("keywordsGained")}</Text>
              <Text style={styles.kwDesc}>{t("keywordsGainedDesc")}</Text>
            </View>
          </View>
          {delta.addedKeywords.length > 0 ? (
            <View style={styles.kwList}>
              {delta.addedKeywords.map((k) => (
                <View key={k} style={[styles.kwPill, { backgroundColor: `${colors.success}15` }]}>
                  <Text style={[styles.kwPillText, { color: colors.success }]}>{k}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.kwEmpty}>{t("noGained")}</Text>
          )}
        </View>

        {/* Still missing */}
        {delta.remainingMissing.length > 0 ? (
          <View style={[styles.kwCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.kwHead}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.kwTitle}>{t("keywordsStillMissing")}</Text>
                <Text style={styles.kwDesc}>{t("keywordsStillMissingDesc")}</Text>
              </View>
            </View>
            <View style={styles.kwList}>
              {delta.remainingMissing.map((k) => (
                <View key={k} style={[styles.kwPill, { backgroundColor: `${colors.warning}15` }]}>
                  <Text style={[styles.kwPillText, { color: colors.warning }]}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Newly missing */}
        {delta.newMissingKeywords.length > 0 ? (
          <View style={[styles.kwCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.kwHead}>
              <IconSymbol name="magnifyingglass" size={20} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.kwTitle}>{t("keywordsNewMissing")}</Text>
                <Text style={styles.kwDesc}>{t("keywordsNewMissingDesc")}</Text>
              </View>
            </View>
            <View style={styles.kwList}>
              {delta.newMissingKeywords.map((k) => (
                <View key={k} style={[styles.kwPill, { backgroundColor: `${colors.error}15` }]}>
                  <Text style={[styles.kwPillText, { color: colors.error }]}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Context labels */}
        <View style={styles.contextRow}>
          <View style={[styles.contextBadge, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.contextText, { color: colors.primary }]}>
              {t("before")}: {delta.before.jobTitle}
            </Text>
          </View>
          <View style={[styles.contextBadge, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.contextText, { color: colors.primary }]}>
              {t("after")}: {delta.after.jobTitle}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function ScoreRow({
  delta: d,
  t,
  colors,
  label,
}: {
  delta: ScoreDelta;
  t: (k: string) => string;
  colors: ReturnType<typeof useColors>;
  label: string;
}) {
  const deltaColor = d.improved ? colors.success : d.declined ? colors.error : colors.muted;
  return (
    <View style={styles.catRow}>
      <Text style={styles.catLabel}>{label}</Text>
      <View style={styles.catScores}>
        <Text style={styles.catScoreBefore}>{d.before}</Text>
        <View style={{ flex: 1, alignItems: "center" }}>
          <ProgressBar percent={d.after} height={6} />
        </View>
        <Text style={[styles.catScoreAfter, { color: deltaColor }]}>{d.after}</Text>
        <Text style={[styles.catDelta, { color: deltaColor }]}>
          {d.delta > 0 ? "+" : ""}
          {d.delta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  title: { fontSize: 26, fontWeight: "800", lineHeight: 34, color: "#4F46E5" },
  subtitle: { fontSize: 14, lineHeight: 20, color: "#6B7280", marginTop: 4, marginBottom: 18 },
  emptyTitle: { fontSize: 18, fontWeight: "700", lineHeight: 25, color: "#111827", marginTop: 8 },
  emptyDesc: { fontSize: 13.5, lineHeight: 19, color: "#6B7280", textAlign: "center" },
  overallCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 18 },
  overallHead: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  overallLabel: { fontSize: 12, lineHeight: 17, color: "#6B7280", marginBottom: 2, fontWeight: "600" },
  overallScores: { flexDirection: "row", alignItems: "center", gap: 8 },
  overallValue: { fontSize: 32, fontWeight: "800", lineHeight: 42 },
  overallDelta: { flex: 1, alignItems: "flex-end" },
  overallDeltaText: { fontSize: 20, fontWeight: "800", lineHeight: 27 },
  overallDeltaSub: { fontSize: 12, lineHeight: 17, marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "700", lineHeight: 25, color: "#111827", marginBottom: 10 },
  catCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 18 },
  catHeader: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8, paddingRight: 70 },
  catHeaderLabel: { fontSize: 11, lineHeight: 15, color: "#9CA3AF", fontWeight: "700", width: 40, textAlign: "center" },
  catRow: { marginBottom: 14 },
  catLabel: { fontSize: 14, fontWeight: "600", lineHeight: 19, color: "#374151", marginBottom: 6 },
  catScores: { flexDirection: "row", alignItems: "center", gap: 8 },
  catScoreBefore: { fontSize: 13, fontWeight: "700", lineHeight: 18, color: "#9CA3AF", width: 28, textAlign: "right" },
  catScoreAfter: { fontSize: 13, fontWeight: "800", lineHeight: 18, width: 28, textAlign: "left" },
  catDelta: { fontSize: 12.5, fontWeight: "800", lineHeight: 17, width: 38, textAlign: "right" },
  kwCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  kwHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  kwTitle: { fontSize: 15, fontWeight: "700", lineHeight: 21, color: "#111827" },
  kwDesc: { fontSize: 12, lineHeight: 17, color: "#6B7280", marginTop: 1 },
  kwList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kwPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  kwPillText: { fontSize: 12.5, fontWeight: "700", lineHeight: 17 },
  kwEmpty: { fontSize: 13, lineHeight: 18, color: "#6B7280" },
  contextRow: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  contextBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  contextText: { fontSize: 11.5, fontWeight: "700", lineHeight: 16 },
});
