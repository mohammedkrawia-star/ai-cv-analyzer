import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/common";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { useAnalysis } from "@/lib/analysis/analysis-store";
import { useHistory } from "@/lib/analysis/history-store";
import { bytesToBase64, isValidPdf, makeParsedCv } from "@/lib/analysis/cv-parser";
import { useExtractCvTextMutation } from "@/lib/analysis/ai-service";

const MAX_BYTES = 10 * 1024 * 1024;

async function readFileBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    const resp = await fetch(uri);
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  }
  const { readAsStringAsync } = await import("expo-file-system/legacy");
  const base64 = await readAsStringAsync(uri, {
    encoding: "base64" as import("expo-file-system/legacy").EncodingType.Base64,
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function UploadScreen() {
  const t = useT();
  const colors = useColors();
  const router = useRouter();
  const { cv, setCv } = useAnalysis();
  const { entries } = useHistory();
  const extractMutation = useExtractCvTextMutation();
  const canCompare = entries.length >= 2;

  const [fileName, setFileName] = useState<string | null>(cv?.fileName ?? null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Create a single reusable hidden input on web and clean it up on unmount.
  if (Platform.OS === "web" && typeof document !== "undefined" && !fileInputRef.current) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.style.display = "none";
    document.body.appendChild(input);
    fileInputRef.current = input;
  }
  useEffect(() => {
    return () => {
      const input = fileInputRef.current;
      if (input && input.parentNode) input.parentNode.removeChild(input);
      fileInputRef.current = null;
    };
  }, []);

  const pickFile = async () => {
    setError(null);
    try {
      let name: string;
      let bytes: Uint8Array;
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = fileInputRef.current!;
        const chosen = await new Promise<File | null>((resolve) => {
          input.value = ""; // allow re-selecting the same file
          const onChange = () => {
            input.removeEventListener("change", onChange);
            resolve(input.files && input.files.length > 0 ? input.files[0] : null);
          };
          input.addEventListener("change", onChange);
          input.click();
        });
        if (!chosen) return;
        name = chosen.name ?? "cv.pdf";
        const buf = await chosen.arrayBuffer();
        bytes = new Uint8Array(buf);
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.length) return;
        const asset = result.assets[0];
        name = asset.name ?? "cv.pdf";
        if (asset.size && asset.size > MAX_BYTES) {
          setError(t("tooLarge"));
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        bytes = await readFileBytes(asset.uri);
      }

      setExtracting(true);
      try {
        if (!isValidPdf(bytes)) {
          setError(t("invalidPdf"));
          setFileName(null);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
        let text = "";
        const base64 = bytesToBase64(bytes);
        const res = await extractMutation.mutateAsync({ base64, fileName: name });
        text = res.text;
        setCv(makeParsedCv(text, name));
        setFileName(name);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        setError(t("extractionError"));
        setFileName(null);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setExtracting(false);
      }
    } catch {
      // user cancelled picker
    }
  };

  const removeFile = () => {
    setFileName(null);
    setCv(null);
    setError(null);
  };

  const confirmInvalid = (msg: string) => {
    Alert.alert(t("errorTitle"), msg);
  };

  const canContinue = !!cv && cv.text.trim().length >= 50 && !extracting;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 32 }}>
        <Text style={styles.title}>{t("uploadTitle")}</Text>
        <Text style={styles.subtitle}>{t("uploadSubtitle")}</Text>

        <Pressable
          onPress={pickFile}
          style={({ pressed }) => [styles.dropZone, { borderColor: colors.primary, backgroundColor: `${colors.primary}08` }, pressed && { opacity: 0.7 } as object]}
        >
          {extracting ? (
            <View style={styles.extracting}>
              <View style={[styles.spinner, { borderColor: colors.primary }]} />
              <Text style={styles.extractingText}>{t("extracting")}</Text>
            </View>
          ) : fileName ? (
            <View style={styles.fileInfo}>
              <IconSymbol name="doc.fill" size={30} color={colors.primary} />
              <Text style={styles.fileName}>{fileName}</Text>
              <Text style={styles.fileMeta}>
                {cv ? `${cv.wordCount} words · ${cv.detectedSections.length} sections detected` : ""}
              </Text>
              <PrimaryButton title={t("replaceFile")} onPress={pickFile} variant="outline" />
              <PrimaryButton title={t("removeFile")} onPress={removeFile} variant="outline" />
            </View>
          ) : (
            <View style={styles.emptyZone}>
              <IconSymbol name="doc.on.doc.fill" size={40} color={colors.primary} />
              <Text style={styles.dropZoneTitle}>{t("dropZone")}</Text>
              <Text style={styles.dropZoneHint}>{t("dropZoneHint")}</Text>
            </View>
          )}
        </Pressable>

        {canCompare ? (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(analyze)/compare");
            }}
            style={({ pressed }) => [
              styles.compareCard,
              { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
              pressed && { opacity: 0.7 } as object,
            ]}
          >
            <IconSymbol name="scale.3d" size={26} color={colors.primary} />
            <Text style={styles.compareTitle}>{t("compareWithPrevious")}</Text>
            <Text style={styles.compareDesc}>{t("comparisonNote")}</Text>
          </Pressable>
        ) : null}

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: `${colors.error}12` }]}>
            <IconSymbol name="xmark.seal.fill" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.continueRow}>
          <View style={{ flex: 1 }} />
          <PrimaryButton
            title={t("continue")}
            disabled={!canContinue}
            loading={extracting}
            onPress={() => {
              if (!canContinue) {
                confirmInvalid(t("invalidPdf"));
                return;
              }
              router.push("/(analyze)/job");
            }}
          />
        </View>
      </ScrollView>
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
  dropZone: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyZone: {
    alignItems: "center",
    paddingVertical: 24,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    color: "#111827",
    marginTop: 14,
  },
  dropZoneHint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 4,
  },
  extracting: {
    alignItems: "center",
    paddingVertical: 24,
  },
  spinner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderTopColor: "transparent",
  },
  extractingText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 14,
  },
  fileInfo: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
    width: "100%",
  },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: "#111827",
    textAlign: "center",
  },
  fileMeta: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#6B7280",
    textAlign: "center",
  },
  compareCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 14,
    alignItems: "center",
    gap: 4,
  },
  compareTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: "#4F46E5",
    marginTop: 4,
  },
  compareDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7280",
    textAlign: "center",
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
  continueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
});
