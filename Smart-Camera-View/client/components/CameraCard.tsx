import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Camera } from "@/types/camera";
import { ThemedText } from "@/components/ThemedText";
import { StatusDot } from "@/components/StatusDot";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CameraCardProps {
  camera: Camera;
  columns: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LiveVideoPreview({ streamUrl, columns }: { streamUrl: string; columns: number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={styles.videoWrapper}>
        {isLoading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.dark.primary} />
          </View>
        ) : null}
        <iframe
          src={streamUrl}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "#000",
          }}
          allow="autoplay"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.placeholder}>
      <Feather
        name="video"
        size={columns > 2 ? 20 : 32}
        color={Colors.dark.primary}
      />
    </View>
  );
}

export function CameraCard({ camera, columns, onPress }: CameraCardProps) {
  const { width } = useWindowDimensions();
  const scale = useSharedValue(1);

  const cardWidth =
    (width - Spacing.lg * 2 - Spacing.md * (columns - 1)) / columns;
  const cardHeight = (cardWidth * 9) / 16;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const showLivePreview = camera.isOnline && camera.streamUrl && Platform.OS === "web";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          width: cardWidth,
          height: cardHeight,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.imageContainer}>
        {showLivePreview && camera.streamUrl ? (
          <LiveVideoPreview streamUrl={camera.streamUrl} columns={columns} />
        ) : camera.thumbnailUrl ? (
          <Image
            source={{ uri: camera.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Feather
              name="video"
              size={columns > 2 ? 20 : 32}
              color={Colors.dark.primary}
            />
          </View>
        )}

        <View style={styles.statusContainer}>
          <StatusDot isOnline={camera.isOnline} />
        </View>

        <View style={styles.nameContainer}>
          {camera.isOnline && camera.streamUrl ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveText}>En vivo</ThemedText>
            </View>
          ) : null}
          <ThemedText
            style={[styles.name, columns > 2 && styles.nameSmall]}
            numberOfLines={1}
          >
            {camera.name}
          </ThemedText>
        </View>

        {!camera.isOnline && (
          <View style={styles.offlineOverlay}>
            <Feather
              name="wifi-off"
              size={columns > 2 ? 16 : 24}
              color={Colors.dark.error}
            />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  thumbnail: {
    flex: 1,
    width: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  videoWrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    zIndex: 1,
  },
  statusContainer: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  nameContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1,
  },
  nameSmall: {
    fontSize: 10,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "600",
  },
  offlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
