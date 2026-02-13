import React, { useState } from "react";
import { View, StyleSheet, Image, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { SettingsRow } from "@/components/SettingsRow";
import { Switch } from "@/components/Switch";
import { useAuth } from "@/context/AuthContext";
import { useCameras } from "@/context/CameraContext";
import { GRID_LAYOUTS } from "@/types/camera";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, biometricEnabled, biometricAvailable, setBiometricEnabled } = useAuth();
  const { cameras, gridColumns, setGridColumns, refreshCameras } = useCameras();

  const [showGridPicker, setShowGridPicker] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setBiometricEnabled(value);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  const handleGridChange = async (columns: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setGridColumns(columns);
    setShowGridPicker(false);
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshCameras();
  };

  const currentLayout = GRID_LAYOUTS.find((l) => l.columns === gridColumns);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={require("../../assets/images/avatar-preset.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <ThemedText type="h3" style={styles.displayName}>
          {user?.displayName || "Usuario"}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.email, { color: Colors.dark.textSecondary }]}
        >
          {user?.email || ""}
        </ThemedText>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: Colors.dark.primary }}>
              {cameras.length}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: Colors.dark.textSecondary }}
            >
              Camaras
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: Colors.dark.success }}>
              {cameras.filter((c) => c.isOnline).length}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: Colors.dark.textSecondary }}
            >
              En linea
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: Colors.dark.textSecondary }]}
        >
          CONFIGURACION
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="grid"
            label="Cuadricula"
            value={currentLayout?.label || "2x2"}
            onPress={() => setShowGridPicker(!showGridPicker)}
            showChevron={true}
          />
          {showGridPicker ? (
            <View style={styles.gridPicker}>
              {GRID_LAYOUTS.map((layout) => (
                <Pressable
                  key={layout.columns}
                  style={[
                    styles.gridOption,
                    gridColumns === layout.columns && styles.gridOptionActive,
                  ]}
                  onPress={() => handleGridChange(layout.columns)}
                >
                  <ThemedText
                    type="body"
                    style={[
                      styles.gridOptionText,
                      gridColumns === layout.columns && {
                        color: Colors.dark.primary,
                      },
                    ]}
                  >
                    {layout.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
          <SettingsRow
            icon="refresh-cw"
            label="Actualizar camaras"
            onPress={handleRefresh}
            showChevron={false}
          />
        </View>
      </View>

      {biometricAvailable && Platform.OS !== "web" ? (
        <View style={styles.section}>
          <ThemedText
            type="small"
            style={[styles.sectionTitle, { color: Colors.dark.textSecondary }]}
          >
            SEGURIDAD
          </ThemedText>
          <View style={styles.sectionContent}>
            <View style={styles.switchRow}>
              <SettingsRow
                icon="smartphone"
                label="Iniciar con huella"
                showChevron={false}
              />
              <View style={styles.switchContainer}>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: Colors.dark.textSecondary }]}
        >
          CUENTA
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="info"
            label="Acerca de"
            onPress={() => navigation.navigate("About")}
          />
          <SettingsRow
            icon="log-out"
            label="Cerrar sesion"
            onPress={handleLogout}
            destructive
            showChevron={false}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  displayName: {
    marginBottom: Spacing.xs,
  },
  email: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
    marginHorizontal: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  gridPicker: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  gridOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  gridOptionActive: {
    backgroundColor: Colors.dark.primary + "30",
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  gridOptionText: {
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchContainer: {
    position: "absolute",
    right: Spacing.md,
  },
});
