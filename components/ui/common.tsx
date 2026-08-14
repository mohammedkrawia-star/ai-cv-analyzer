import React, { createContext, useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

// ---------------- Score Bar ----------------
interface ScoreBarProps {
  label: string;
  score: number;
}

export function ScoreBar({ label, score }: ScoreBarProps) {
  const colors = useColors();
  const pct = Math.min(100, Math.max(0, score));
  const color =
    score >= 75 ? colors.success : score >= 45 ? colors.warning : colors.error;
  return (
    <View style={styles.barRow}>
      <Text className="text-sm text-foreground" style={{ flex: 1, lineHeight: 20 }}>
        {label}
      </Text>
      <Text className="text-sm font-semibold text-muted" style={{ lineHeight: 20, marginRight: 8 }}>
        {Math.round(score)}
      </Text>
      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            { backgroundColor: color, width: `${pct}%`, minWidth: pct > 0 ? 6 : 0 },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------- Linear Progress Bar ----------------
export function ProgressBar({ percent, height = 10 }: { percent: number; height?: number }) {
  const colors = useColors();
  const pct = Math.min(100, Math.max(0, percent));
  const color =
    pct >= 75 ? colors.success : pct >= 45 ? colors.warning : colors.error;
  return (
    <View style={[styles.barTrack, { backgroundColor: colors.border, height }]}>
      <View
        style={[
          styles.barFill,
          { backgroundColor: color, width: `${pct}%`, minWidth: pct > 0 ? 6 : 0 },
        ]}
      />
    </View>
  );
}

// ---------------- Primary Button ----------------
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  /** Optional leading icon (SF Symbol name via IconSymbol) */
  icon?: React.ComponentProps<typeof IconSymbol>["name"];
}

export function PrimaryButton({ title, onPress, disabled, loading, variant = "primary", icon }: PrimaryButtonProps) {
  const colors = useColors();
  const handlePress = () => {
    if (disabled || loading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const bgColor =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.surface
        : "transparent";
  const borderColor = variant === "outline" ? colors.border : "transparent";
  const textColor = variant === "primary" ? "#ffffff" : colors.foreground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        disabled ? { opacity: 0.45 } : undefined,
      ]}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View
        style={[
          styles.buttonInner,
          { backgroundColor: bgColor, borderColor, borderWidth: variant === "outline" ? 1 : 0 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} style={{ marginRight: 8 }} />
        ) : icon ? (
          <IconSymbol name={icon} size={18} color={textColor} style={{ marginRight: 8 }} />
        ) : null}
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------- Toast ----------------
interface ToastContextValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message ? (
        <View style={styles.toastLayer} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  button: {
    borderRadius: 14,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  toastLayer: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    backgroundColor: "#111827",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
