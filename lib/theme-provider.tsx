import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "aicv.theme.v1";

let savedPreference: ThemePreference = "system";
const themeListeners = new Set<() => void>();

function notifyThemeListeners() {
  themeListeners.forEach((l) => l());
}

function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => themeListeners.delete(cb);
}

export function getThemePreference(): ThemePreference {
  return savedPreference;
}

export async function setThemePreference(pref: ThemePreference) {
  savedPreference = pref;
  try {
    await AsyncStorage.setItem(THEME_KEY, pref);
  } catch {
    /* ignore */
  }
  notifyThemeListeners();
}

export function useTheme(): { themePreference: ThemePreference; setColorScheme: (scheme: ColorScheme) => void } {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  const [pref, setPref] = useState<ThemePreference>(() => savedPreference);
  useEffect(() => {
    const unsub = subscribeTheme(() => {
      setPref(savedPreference);
    });
    return () => {
      unsub();
    };
  }, []);
  return { themePreference: pref, setColorScheme: ctx.setColorScheme };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          savedPreference = saved;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setHydrated(true);
      notifyThemeListeners();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive effective scheme from saved preference + system scheme.
  useEffect(() => {
    if (!hydrated) return;
    const effective = savedPreference === "system" ? systemScheme : (savedPreference as ColorScheme);
    setColorSchemeState(effective);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, systemScheme]);

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme);
  }, [applyScheme]);

  useEffect(() => {
    applyScheme(colorScheme);
  }, [applyScheme, colorScheme]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
    }),
    [colorScheme, setColorScheme],
  );

  // Render immediately with the effective default scheme (system until hydrated)
  // so users never see a blank screen while AsyncStorage loads.
  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
