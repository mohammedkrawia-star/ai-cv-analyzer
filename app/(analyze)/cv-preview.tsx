import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton, useToast } from "@/components/ui/common";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import {
  isCvHeading,
  openCvPrintWindow,
  readEditedCv,
  updateEditedCv,
} from "@/lib/analysis/improved-cv";
import { useAnalysis } from "@/lib/analysis/analysis-store";

/**
 * Preview & edit the improved CV before downloading it as PDF.
 * Accessed from the results screen after "Generate Improved CV" succeeds.
 */
export default function CvPreviewScreen() {
  const t = useT();
  const colors = useColors();
  const toast = useToast();
  const { jobTitle } = useAnalysis();
  const params = useLocalSearchParams<{ id?: string }>();

  const id = params.id ? Number(params.id) : NaN;
  const stored = Number.isFinite(id) ? readEditedCv(id) : undefined;

  const [text, setText] = useState<string>(stored ?? "");
  const textRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (stored) {
      setText(stored);
    }
  }, [stored]);

  const cvText = text;

  const applyChanges = () => {
    if (!Number.isFinite(id)) return;
    updateEditedCv(id, cvText);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toast.show(t("editsSaved"));
  };

  const downloadPdf = () => {
    if (!cvText.trim()) return;
    if (Platform.OS === "web") {
      const opened = openCvPrintWindow({ jobTitle, cvText });
      if (opened) {
        toast.show(t("improvedCvReady"));
      } else {
        void Clipboard.setStringAsync(cvText).then(() =>
          toast.show(t("pdfBlockedFallback")),
        );
      }
    } else {
      Alert.alert(t("improvedCvDownload"), cvText);
    }
  };

  const copyCv = async () => {
    if (!cvText.trim()) return;
    await Clipboard.setStringAsync(cvText);
    toast.show(t("copied"));
  };

  const lines = cvText.split("\n");

  if (!stored) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={styles.center}>
          <IconSymbol name="doc.text.viewfinder" size={44} color={colors.muted} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>{t("editCvTitle")}</Text>
          <Text style={styles.emptyDesc}>{t("previewUnavailable")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1, padding: 20, paddingBottom: 12 }}>
          <Text style={styles.title}>{t("editCvTitle")}</Text>
          <Text style={styles.subtitle}>{t("editCvDesc")}</Text>

          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.cvTitle}>{jobTitle}</Text>
            {lines.map((line, idx) => {
              if (isCvHeading(line)) {
                return (
                  <Text key={idx} style={styles.sectionHeader}>
                    {line.trim()}
                  </Text>
                );
              }
              if (line.trim().length === 0) {
                return <View key={idx} style={{ height: 8 }} />;
              }
              return (
                <Text key={idx} style={styles.bodyLine}>
                  {line}
                </Text>
              );
            })}
            {/* Hidden editor: the real editing happens in the TextInput below,
                but on web we also render the same text in an input field. */}
          </ScrollView>

          <Text style={styles.editLabel}>{t("editCvText")}</Text>
          <TextInput
            ref={textRef}
            style={[
              styles.editor,
              { borderColor: colors.border, color: colors.foreground },
            ]}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            scrollEnabled
          />

          <PrimaryButton
            title={t("saveChanges")}
            icon="checkmark"
            onPress={applyChanges}
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title={t("downloadImprovedCvPdf")}
            icon="arrow.down.to.line"
            onPress={downloadPdf}
          />
          <View style={{ height: 10 }} />
          <PrimaryButton title={t("copyImprovedCv")} onPress={copyCv} variant="outline" />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = {
  title: { fontSize: 22, fontWeight: "800", color: "#111827", lineHeight: 30 } as const,
  subtitle: { fontSize: 14, color: "#6B7280", lineHeight: 20, marginTop: 4, marginBottom: 14 } as const,
  previewScroll: { maxHeight: 240, marginBottom: 12 } as const,
  previewContent: { padding: 14, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#FAFAFA" } as const,
  cvTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 10, lineHeight: 25 } as const,
  sectionHeader: { fontSize: 13, fontWeight: "800", color: "#4F46E5", textTransform: "uppercase" as const, letterSpacing: 1, marginTop: 14, marginBottom: 4, lineHeight: 19 } as const,
  bodyLine: { fontSize: 13.5, color: "#374151", lineHeight: 20, marginBottom: 3 } as const,
  editLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.5 } as const,
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 } as const,
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", lineHeight: 25 } as const,
  emptyDesc: { fontSize: 14, color: "#6B7280", lineHeight: 20, textAlign: "center" as const } as const,
  emptyIcon: { marginBottom: 4 } as const,
  editor: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 13.5,
    lineHeight: 20,
    minHeight: 160,
    maxHeight: 320,
  } as const,
};
