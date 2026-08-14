import React from "react";
import { ScrollView, Text, View, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PrimaryButton } from "@/components/ui/common";
import { useColors } from "@/hooks/use-colors";
import { useT, useLanguage, setLanguage, type Language } from "@/lib/i18n";
import { useTheme, setThemePreference, type ThemePreference } from "@/lib/theme-provider";

export default function SettingsScreen() {
  const t = useT();
  const colors = useColors();
  const lang = useLanguage();
  const { themePreference } = useTheme();

  const languages: { value: Language; label: string }[] = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
  ];

  const themes: { value: ThemePreference; labelKey: "light" | "dark" }[] = [
    { value: "light", labelKey: "light" },
    { value: "dark", labelKey: "dark" },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}>
        <Text style={styles.title}>{t("settingsTitle")}</Text>

        <Text style={styles.sectionLabel}>{t("language")}</Text>
        <View style={styles.optionsRow}>
          {languages.map((l) => (
            <PrimaryButton
              key={l.value}
              title={l.label}
              variant={lang === l.value ? "primary" : "outline"}
              onPress={async () => {
                await setLanguage(l.value);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t("theme")}</Text>
        <View style={styles.optionsRow}>
          {themes.map((th) => (
            <PrimaryButton
              key={th.value}
              title={t(th.labelKey)}
              variant={themePreference === th.value ? "primary" : "outline"}
              onPress={() => setThemePreference(th.value)}
            />
          ))}
        </View>

        <View style={[styles.aboutCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <IconSymbol name="sparkles" size={22} color={colors.primary} />
          <Text style={styles.aboutText}>{t("appName")}</Text>
          <Text style={styles.versionText}>{t("appVersion")}</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
    color: "#4F46E5",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 32,
  },
  aboutText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    color: "#111827",
  },
  versionText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: "#9CA3AF",
  },
});
