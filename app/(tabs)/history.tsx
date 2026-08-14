import React from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton, ProgressBar } from "@/components/ui/common";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { useHistory } from "@/lib/analysis/history-store";
import { useAnalysis } from "@/lib/analysis/analysis-store";
import type { HistoryEntry } from "@/lib/analysis/types";

export default function HistoryScreen() {
  const t = useT();
  const colors = useColors();
  const router = useRouter();
  const { entries, removeEntry } = useHistory();
  const { setCv, setJob, setResult } = useAnalysis();
  const canCompare = entries.length >= 2;

  const openEntry = (entry: HistoryEntry) => {
    setJob(entry.jobTitle, entry.input.jobDescription ?? "");
    if (entry.input.cvText) {
      setCv({
        text: entry.input.cvText,
        fileName: entry.fileName ?? "cv.pdf",
        wordCount: entry.input.cvText.split(/\s+/).filter(Boolean).length,
        detectedSections: [],
      });
    } else {
      setCv(null);
    }
    setResult(entry.result, "ai");
    router.push("/(analyze)/results");
  };

  const confirmDelete = (id: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(t("deleteConfirm"))) {
        removeEntry(id);
      }
      return;
    }
    Alert.alert(t("delete"), t("deleteConfirm"), [
      { text: t("close"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          removeEntry(id);
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>{t("historyTitle")}</Text>
      </View>
      {entries.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol name="clock.fill" size={48} color={colors.muted} />
          <Text style={styles.emptyTitle}>{t("emptyHistory")}</Text>
          <Text style={styles.emptyDesc}>{t("emptyHistoryDesc")}</Text>
          <View style={styles.emptyCta}>
            <PrimaryButton
              title={t("startAnalyzing")}
              onPress={() => router.push("/(analyze)/upload")}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.jobTitle}
                  </Text>
                  <Text style={styles.cardMeta}>{new Date(item.date).toLocaleString()}</Text>
                </View>
                <Text style={[styles.scorePill, { backgroundColor: `${colors.primary}14` }]}>
                  <Text style={[styles.scorePillText, { color: colors.primary }]}>
                    {item.overallScore}
                  </Text>
                </Text>
              </View>
              <View style={styles.progress}>
                <ProgressBar percent={item.overallScore} height={7} />
              </View>
              <View style={styles.cardActions}>
                <PrimaryButton
                  title={t("viewResults")}
                  variant="primary"
                  onPress={() => openEntry(item)}
                />
                <PrimaryButton
                  title={t("compareWithThis")}
                  variant="outline"
                  disabled={!canCompare}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/(analyze)/compare", params: { currentId: item.id } });
                  }}
                />
                <PrimaryButton
                  title={t("delete")}
                  variant="outline"
                  onPress={() => confirmDelete(item.id)}
                />
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    color: "#4F46E5",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 25,
    color: "#111827",
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  emptyCta: { marginTop: 16, width: "100%" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#111827",
  },
  cardMeta: {
    fontSize: 12.5,
    lineHeight: 17,
    color: "#9CA3AF",
    marginTop: 2,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scorePillText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },
  progress: { marginTop: 12 },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
});
