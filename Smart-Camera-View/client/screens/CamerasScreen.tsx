import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Camera } from "@/types/camera";
import { CameraCard } from "@/components/CameraCard";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useCameras } from "@/context/CameraContext";
import { Colors, Spacing } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CamerasScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { cameras, isLoading, refreshCameras, gridColumns, error } = useCameras();

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshCameras();
  }, [refreshCameras]);

  const handleCameraPress = useCallback(
    (camera: Camera) => {
      navigation.navigate("CameraFullscreen", { camera });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Camera; index: number }) => (
      <View
        style={[
          styles.cardWrapper,
          {
            marginRight:
              (index + 1) % gridColumns === 0 ? 0 : Spacing.md,
          },
        ]}
      >
        <CameraCard
          camera={item}
          columns={gridColumns}
          onPress={() => handleCameraPress(item)}
        />
      </View>
    ),
    [gridColumns, handleCameraPress],
  );

  const renderEmpty = useCallback(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            image={require("../../assets/images/connection-error.png")}
            title="Error de conexion"
            description={error}
            actionLabel="Reintentar"
            onAction={handleRefresh}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          image={require("../../assets/images/empty-cameras.png")}
          title="Sin camaras"
          description="No se encontraron camaras en tu cuenta Smart Life. Asegurate de tener camaras vinculadas."
          actionLabel="Actualizar"
          onAction={handleRefresh}
        />
      </View>
    );
  }, [error, handleRefresh]);

  const renderHeader = useCallback(() => {
    if (cameras.length === 0) return null;
    
    const onlineCameras = cameras.filter(c => c.isOnline).length;
    
    return (
      <View style={styles.headerInfo}>
        <ThemedText type="small" style={{ color: Colors.dark.textSecondary }}>
          {cameras.length} camara{cameras.length !== 1 ? "s" : ""} - {onlineCameras} en linea
        </ThemedText>
      </View>
    );
  }, [cameras]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.dark.backgroundRoot }]}>
      <FlatList
        data={cameras}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={gridColumns}
        key={gridColumns}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.lg,
          },
          cameras.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.dark.primary}
            colors={[Colors.dark.primary]}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerInfo: {
    marginBottom: Spacing.md,
  },
});
