import React from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";

const FEATURES = [
  { icon: "chart.bar.fill", titleKey: "featureAts", descKey: "featureAtsDesc" },
  { icon: "checkmark.seal.fill", titleKey: "featureSkills", descKey: "featureSkillsDesc" },
  { icon: "magnifyingglass", titleKey: "featureKeywords", descKey: "featureKeywordsDesc" },
  { icon: "sparkles", titleKey: "featureAi", descKey: "featureAiDesc" },
] as const;

const STEPS = [
  { step: 1, titleKey: "step1", descKey: "step1Desc" },
  { step: 2, titleKey: "step2", descKey: "step2Desc" },
  { step: 3, titleKey: "step3", descKey: "step3Desc" },
] as const;

export default function HomeScreen() {
  const t = useT();
  const router = useRouter();
  const colors = useColors();

  const startAnalysis = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/(analyze)/upload");
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <IconSymbol name="sparkles" size={34} color="#ffffff" />
          <Text style={styles.appName}>{t("appName")}</Text>
          <Text style={styles.heroTitle}>{t("heroTitle")}</Text>
          <Text style={styles.heroSubtitle}>{t("heroSubtitle")}</Text>
          <View style={styles.ctaRow}>
            <View style={[styles.ctaButton, { backgroundColor: "#ffffff" }]}>
              <Text
                style={[styles.ctaText, { color: colors.primary }]}
                onPress={startAnalysis}
              >
                {t("ctaAnalyze")}
              </Text>
            </View>
          </View>
        </View>

        {/* Feature cards */}
        <Text style={styles.sectionTitle}>{t("keyFeatures")}</Text>
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <View key={f.titleKey} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}14` }]}>
                <IconSymbol name={f.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{t(f.titleKey)}</Text>
              <Text style={styles.cardDesc}>{t(f.descKey)}</Text>
            </View>
          ))}
        </View>

        {/* 3 steps */}
        <Text style={styles.sectionTitle}>{t("stepsTitle")}</Text>
        <View style={[styles.stepsCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {STEPS.map((s, idx) => (
            <View key={s.step} style={styles.stepRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>{s.step}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{t(s.titleKey)}</Text>
                <Text style={styles.stepDesc}>{t(s.descKey)}</Text>
              </View>
              {idx < STEPS.length - 1 ? (
                <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
        <View style={[styles.bottomCta, { borderColor: colors.primary }]}>
          <Text
            style={[styles.bottomCtaText, { color: colors.primary }]}
            onPress={startAnalysis}
          >
            {t("ctaAnalyze")}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 36,
    alignItems: "center",
  },
  appName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 38,
    textAlign: "center",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },
  ctaRow: { marginTop: 24 },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
    paddingHorizontal: 20,
    paddingTop: 28,
    marginBottom: 14,
    color: "#111827",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: "47%",
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignSelf: "flex-start",
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 4,
    color: "#111827",
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#6B7280",
  },
  stepsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: "#111827",
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 2,
  },
  stepDivider: {
    position: "absolute",
    left: 14,
    top: 44,
    bottom: -2,
    width: 2,
    borderRadius: 1,
  },
  bottomCta: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  bottomCtaText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#4F46E5",
  },
});
