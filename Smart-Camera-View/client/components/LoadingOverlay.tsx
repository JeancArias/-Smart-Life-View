import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        {message ? (
          <ThemedText type="body" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 20, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  content: {
    alignItems: "center",
  },
  message: {
    marginTop: Spacing.lg,
    color: Colors.dark.textSecondary,
  },
});
