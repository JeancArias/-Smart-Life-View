import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

interface StatusDotProps {
  isOnline: boolean;
  size?: number;
}

export function StatusDot({ isOnline, size = 8 }: StatusDotProps) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? Colors.dark.success : Colors.dark.error,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
