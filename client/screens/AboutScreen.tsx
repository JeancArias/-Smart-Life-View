import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing } from "@/constants/theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        alignItems: "center",
      }}
    >
      <Image
        source={require("../../assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <ThemedText type="h2" style={styles.appName}>
        Smart Cam View
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.version, { color: Colors.dark.textSecondary }]}
      >
        Version 1.0.0
      </ThemedText>

      <View style={styles.descriptionContainer}>
        <ThemedText type="body" style={styles.description}>
          Visualiza todas tus camaras Smart Life en una sola pantalla. Compatible con dispositivos moviles y Google TV.
        </ThemedText>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <ThemedText style={{ color: Colors.dark.primary, fontSize: 24 }}>
              4
            </ThemedText>
          </View>
          <ThemedText
            type="small"
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            Vista en mosaico configurable
          </ThemedText>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <ThemedText style={{ color: Colors.dark.primary, fontSize: 24 }}>
              TV
            </ThemedText>
          </View>
          <ThemedText
            type="small"
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            Soporte para Google TV
          </ThemedText>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureIcon}>
            <ThemedText style={{ color: Colors.dark.primary, fontSize: 24 }}>
              PTZ
            </ThemedText>
          </View>
          <ThemedText
            type="small"
            style={{ color: Colors.dark.textSecondary, textAlign: "center" }}
          >
            Control PTZ para camaras compatibles
          </ThemedText>
        </View>
      </View>

      <ThemedText
        type="small"
        style={[styles.copyright, { color: Colors.dark.textSecondary }]}
      >
        Desarrollado para visualizar camaras Smart Life / Tuya
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  appName: {
    marginBottom: Spacing.xs,
  },
  version: {
    marginBottom: Spacing["3xl"],
  },
  descriptionContainer: {
    paddingHorizontal: Spacing["3xl"],
    marginBottom: Spacing["3xl"],
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["3xl"],
    gap: Spacing.lg,
  },
  feature: {
    flex: 1,
    alignItems: "center",
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "40",
  },
  copyright: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
