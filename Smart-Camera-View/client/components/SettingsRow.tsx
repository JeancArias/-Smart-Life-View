import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
}: SettingsRowProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={!onPress}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: destructive ? Colors.dark.error + "20" : Colors.dark.backgroundTertiary },
          ]}
        >
          <Feather
            name={icon}
            size={18}
            color={destructive ? Colors.dark.error : Colors.dark.primary}
          />
        </View>
        <ThemedText
          type="body"
          style={[destructive && { color: Colors.dark.error }]}
        >
          {label}
        </ThemedText>
      </View>
      <View style={styles.right}>
        {value ? (
          <ThemedText
            type="small"
            style={{ color: Colors.dark.textSecondary, marginRight: Spacing.sm }}
          >
            {value}
          </ThemedText>
        ) : null}
        {showChevron && onPress ? (
          <Feather
            name="chevron-right"
            size={20}
            color={Colors.dark.textSecondary}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  pressed: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});
