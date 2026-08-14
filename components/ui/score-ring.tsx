import React from "react";
import Svg, { Circle } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/** Circular progress indicator for scores. */
export function ScoreRing({ score, size = 120, strokeWidth = 10, label }: ScoreRingProps) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score)) / 100;

  const color =
    score >= 75 ? colors.success : score >= 45 ? colors.warning : colors.error;

  return (
    <View style={[styles.relative, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.overlay, { width: size, height: size }]}>
        <Text style={styles.scoreText}>{Math.round(score)}</Text>
        {label ? <Text style={styles.labelText}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  relative: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  overlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 40,
    color: "#111827",
  },
  labelText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    color: "#6B7280",
  },
});
