import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/common";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { useAnalysis } from "@/lib/analysis/analysis-store";
import { guardResult } from "@/lib/analysis/result-guard";
import { runFallbackAnalysis, useAnalyzeMutation } from "@/lib/analysis/ai-service";
import { useHistory } from "@/lib/analysis/history-store";

export default function JobScreen() {
  const t = useT();
  const colors = useColors();
  const router = useRouter();
  const { cv, setResult } = useAnalysis();
  const { addEntry } = useHistory();
  const analyzeMutation = useAnalyzeMutation();

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {
    const input = { cvText: cv!.text, jobDescription, jobTitle: jobTitle.trim() || "Target Role" };
    setAnalyzing(true);
    setError(null);
    try {
      let result;
      let source: "ai" | "fallback" = "ai";
      try {
        result = await analyzeMutation.mutateAsync(input);
      } catch {
        result = await runFallbackAnalysis(input);
        source = "fallback";
      }
      const guarded = guardResult(result as unknown as Record<string, unknown>);
      setResult(guarded, source);
      addEntry({ jobTitle: jobTitle.trim() || "Target Role", overallScore: guarded.overallScore, fileName: cv!.fileName, input, result: guarded });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/(analyze)/results");
    } catch {
      setError(t("errorTitle"));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = () => {
    if (analyzing) return;
    if (!cv) {
      setError(t("uploadCvFirst"));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.back();
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError(t("jdRequired"));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runAnalysis();
  };

  const inputStyle = {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.foreground,
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 32 }}>
          <Text style={styles.title}>{t("jobTitle")}</Text>
          <Text style={styles.subtitle}>{t("step2Desc")}</Text>

          <Text style={styles.label}>{t("targetTitle")}</Text>
          <TextInput
            style={[styles.input, inputStyle]}
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholder={t("targetTitleHint")}
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            onSubmitEditing={() => {}}
            autoCapitalize="words"
            accessibilityLabel={t("targetTitle")}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>{t("pasteJd")}</Text>
          <TextInput
            style={[styles.textArea, inputStyle]}
            value={jobDescription}
            onChangeText={setJobDescription}
            placeholder={t("pasteJd")}
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            accessibilityLabel={t("pasteJd")}
          />
          <Text style={styles.charCount}>{jobDescription.trim().length} characters</Text>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: `${colors.error}12` }]}>
              <IconSymbol name="xmark.seal.fill" size={18} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.ctaRow}>
            <PrimaryButton
              title={t("analyzeCta")}
              onPress={submit}
              loading={analyzing}
              disabled={analyzing}
            />
          </View>

          {analyzing ? (
            <View style={styles.analyzing}>
              <View style={[styles.spinner, { borderColor: colors.primary }]} />
              <Text style={styles.analyzingText}>{t("analyzing")}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    color: "#111827",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 220,
  },
  charCount: {
    fontSize: 12,
    lineHeight: 16,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "right",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13.5,
    lineHeight: 19,
    flex: 1,
  },
  ctaRow: {
    marginTop: 24,
  },
  analyzing: {
    alignItems: "center",
    marginTop: 24,
  },
  spinner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderTopColor: "transparent",
  },
  analyzingText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});
