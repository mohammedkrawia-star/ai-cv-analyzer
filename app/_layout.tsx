import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";
import { trpc, createTRPCClient } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { AnalysisProvider } from "@/lib/analysis/analysis-store";
import { HistoryProvider } from "@/lib/analysis/history-store";
import { ToastProvider } from "@/components/ui/common";
import React, { Component as ReactComponent, ErrorInfo, ReactNode } from "react";
import { hydrateLanguage } from "@/lib/i18n";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

// Persist fatal JS errors so a crash loop is diagnosable (never throws).
try {
  const origHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
  (globalThis as any).ErrorUtils?.setGlobalHandler(
    async (error: Error, isFatal: boolean) => {
      try {
        await AsyncStorage.setItem(
          "aicv.lastFatalError",
          JSON.stringify({ ts: Date.now(), isFatal, message: String(error?.message ?? error) }),
        );
      } catch {
        /* ignore */
      }
      origHandler?.(error, isFatal);
    },
  );
} catch {
  /* ErrorUtils unavailable (web/other hosts) — fine */
}

/** Root ErrorBoundary: if rendering fatally fails, show a recovery screen
 *  instead of letting the app process exit silently. */
interface EBProps {
  children: ReactNode;
}
interface EBState {
  hasError: boolean;
  error: string;
}

class RootErrorBoundary extends ReactComponent<EBProps, EBState> {
  state: EBState = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: String(error?.message ?? error) };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  async reset() {
    try {
      await AsyncStorage.removeItem("aicv.theme.v1");
      await AsyncStorage.removeItem("aicv.lang");
    } catch {
      /* ignore */
    }
    this.setState({ hasError: false, error: "" });
    try {
      // Reload the JS bundle to recover from transient init errors.
      const g = globalThis as any;
      if (typeof g.__EXPO_ROUTER_REFRESH__ === "function") g.__EXPO_ROUTER_REFRESH__();
      if (typeof g?.location?.reload === "function") g.location.reload();
    } catch {
      /* native: full reload will happen naturally on next launch */
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#11181C", textAlign: "center", marginBottom: 8 }}>
            Something went wrong on startup
          </Text>
          <Text style={{ fontSize: 14, color: "#687076", textAlign: "center", marginBottom: 16 }}>
            {this.state.error || "The app encountered an unexpected error during startup."}
          </Text>
          <TouchableOpacity
            onPress={() => this.reset()}
            activeOpacity={0.8}
            style={{ backgroundColor: "#4F46E5", borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
    hydrateLanguage();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AnalysisProvider>
            <HistoryProvider>
              <ToastProvider>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(analyze)" options={{ presentation: "modal" }} />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="auto" />
              </ToastProvider>
            </HistoryProvider>
          </AnalysisProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <RootErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider initialMetrics={providerInitialMetrics}>
            <SafeAreaFrameContext.Provider value={frame}>
              <SafeAreaInsetsContext.Provider value={insets}>
                {content}
              </SafeAreaInsetsContext.Provider>
            </SafeAreaFrameContext.Provider>
          </SafeAreaProvider>
        </ThemeProvider>
      </RootErrorBoundary>
    );
  }

  return (
    <RootErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
      </ThemeProvider>
    </RootErrorBoundary>
  );
}
