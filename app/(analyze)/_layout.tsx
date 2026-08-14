import { Stack, useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useT } from "@/lib/i18n";
import { Platform, Pressable, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

/**
 * Stack for the analysis flow: Upload CV -> Job Description -> Results.
 * Presented as a modal-style stack from any tab.
 */
export default function AnalyzeStack() {
  const colors = useColors();
  const t = useT();
  const router = useRouter();

  const headerBack = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.foreground,
    headerTitle: "",
    headerBackVisible: false,
    headerLeft: () => (
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.6 : 1,
          padding: 4,
        })}
      >
        {Platform.OS !== "web" ? (
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        ) : (
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 15 }}>
            {t("back")}
          </Text>
        )}
      </Pressable>
    ),
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="upload" options={headerBack} />
      <Stack.Screen name="job" options={headerBack} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
      <Stack.Screen name="compare" options={headerBack} />
      <Stack.Screen name="cv-preview" options={headerBack} />
    </Stack>
  );
}
