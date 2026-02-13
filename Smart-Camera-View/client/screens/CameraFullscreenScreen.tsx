import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { StatusDot } from "@/components/StatusDot";
import { useCameras } from "@/context/CameraContext";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { DeviceStatus } from "@/types/camera";

type RouteProps = RouteProp<RootStackParamList, "CameraFullscreen">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  active?: boolean;
  label?: string;
}

function ActionButton({ icon, onPress, size = 22, disabled, active, label }: ActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.actionBtn,
        animatedStyle,
        disabled && styles.actionBtnDisabled,
        active && styles.actionBtnActive,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Feather
        name={icon}
        size={size}
        color={active ? Colors.dark.primary : "#FFFFFF"}
      />
    </AnimatedPressable>
  );
}

function PTZJoystick({ onMove }: { onMove: (direction: string) => void }) {
  const [knobPosition, setKnobPosition] = useState({ x: 0, y: 0 });
  const joystickRadius = 50;
  const knobRadius = 18;
  const maxOffset = joystickRadius - knobRadius;
  const lastDirection = useRef<string | null>(null);
  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDistance = Math.min(distance, maxOffset);
        const angle = Math.atan2(dy, dx);
        const clampedX = clampedDistance * Math.cos(angle);
        const clampedY = clampedDistance * Math.sin(angle);
        setKnobPosition({ x: clampedX, y: clampedY });

        if (distance > 15) {
          let direction: string;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx > absDy) {
            direction = dx > 0 ? "right" : "left";
          } else {
            direction = dy > 0 ? "down" : "up";
          }

          if (direction !== lastDirection.current) {
            lastDirection.current = direction;
            if (moveTimeout.current) clearTimeout(moveTimeout.current);
            moveTimeout.current = setTimeout(() => {
              onMove(direction);
            }, 100);
          }
        }
      },
      onPanResponderRelease: () => {
        setKnobPosition({ x: 0, y: 0 });
        lastDirection.current = null;
        if (moveTimeout.current) {
          clearTimeout(moveTimeout.current);
          moveTimeout.current = null;
        }
      },
    })
  ).current;

  return (
    <View style={styles.joystickContainer}>
      <View style={styles.joystickBase} {...panResponder.panHandlers}>
        <View style={styles.joystickDirections}>
          <Feather name="chevron-up" size={14} color="rgba(255,255,255,0.3)" style={styles.dirUp} />
          <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.3)" style={styles.dirDown} />
          <Feather name="chevron-left" size={14} color="rgba(255,255,255,0.3)" style={styles.dirLeft} />
          <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.3)" style={styles.dirRight} />
        </View>
        <View
          style={[
            styles.joystickKnob,
            {
              transform: [
                { translateX: knobPosition.x },
                { translateY: knobPosition.y },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

function VideoPlayer({ streamUrl, onError }: { streamUrl: string; onError: () => void }) {
  if (Platform.OS === "web") {
    return (
      <iframe
        src={streamUrl}
        style={{ flex: 1, width: "100%", height: "100%", border: "none", backgroundColor: "#000" }}
        allow="autoplay; fullscreen"
        onError={onError}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      <Feather name="video" size={64} color={Colors.dark.primary} />
      <ThemedText type="body" style={styles.loadingText}>
        Stream disponible
      </ThemedText>
      <ThemedText type="small" style={[styles.loadingText, { color: Colors.dark.textSecondary }]}>
        Abre en Expo Go para ver el video
      </ThemedText>
    </View>
  );
}

function BottomPanel({
  title,
  visible,
  onClose,
  children,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.panelOverlay}
    >
      <Pressable style={styles.panelBackdrop} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <ThemedText type="h4" style={styles.panelTitle}>
            {title}
          </ThemedText>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>
        <ScrollView style={styles.panelContent}>{children}</ScrollView>
      </View>
    </Animated.View>
  );
}

export default function CameraFullscreenScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const {
    getCameraStreamUrl,
    controlPTZ,
    sendCommand,
    getDeviceStatus,
    getRecordingDates,
    globalAudioMuted,
    setGlobalAudioMuted,
  } = useCameras();
  const { camera } = route.params;

  const [showControls, setShowControls] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState(false);

  const [motionDetection, setMotionDetection] = useState(false);
  const [decibelDetection, setDecibelDetection] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [showArmingPanel, setShowArmingPanel] = useState(false);
  const [showRecordingsPanel, setShowRecordingsPanel] = useState(false);
  const [recordingDates, setRecordingDates] = useState<string[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  useEffect(() => {
    loadStream();
    loadDeviceStatus();
  }, [camera.id]);

  async function loadStream() {
    setIsLoadingStream(true);
    setStreamError(false);
    try {
      const url = await getCameraStreamUrl(camera.id);
      setStreamUrl(url);
      if (!url) setStreamError(true);
    } catch {
      setStreamError(true);
    } finally {
      setIsLoadingStream(false);
    }
  }

  async function loadDeviceStatus() {
    setStatusLoading(true);
    try {
      const statuses = await getDeviceStatus(camera.id);
      if (Array.isArray(statuses)) {
        statuses.forEach((s: DeviceStatus) => {
          if (s.code === "motion_switch") setMotionDetection(s.value === true);
          if (s.code === "decibel_switch") setDecibelDetection(s.value === true);
        });
      }
    } catch {
    } finally {
      setStatusLoading(false);
    }
  }

  const toggleControls = () => {
    if (!showArmingPanel && !showRecordingsPanel) {
      setShowControls((prev) => !prev);
    }
  };

  const handleClose = () => navigation.goBack();

  const handleScreenshot = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePTZ = async (direction: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await controlPTZ(camera.id, direction);
  };

  const handleToggleMotion = async () => {
    const newValue = !motionDetection;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await sendCommand(camera.id, "motion_switch", newValue);
    if (success) setMotionDetection(newValue);
  };

  const handleToggleDecibel = async () => {
    const newValue = !decibelDetection;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await sendCommand(camera.id, "decibel_switch", newValue);
    if (success) setDecibelDetection(newValue);
  };

  const handleToggleAudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setGlobalAudioMuted(!globalAudioMuted);
  };

  const handleShowRecordings = async () => {
    setShowRecordingsPanel(true);
    setRecordingsLoading(true);
    try {
      const dates = await getRecordingDates(camera.id);
      setRecordingDates(dates);
    } catch {
    } finally {
      setRecordingsLoading(false);
    }
  };

  const renderVideoPlayer = () => {
    if (isLoadingStream) {
      return (
        <View style={styles.placeholder}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <ThemedText type="body" style={styles.loadingText}>
            Conectando a la camara...
          </ThemedText>
        </View>
      );
    }

    if (streamError || !streamUrl) {
      return (
        <View style={styles.placeholder}>
          <Feather name="video-off" size={64} color={Colors.dark.error} />
          <ThemedText type="body" style={[styles.loadingText, { color: Colors.dark.error }]}>
            {camera.isOnline ? "No se pudo obtener el stream" : "Camara sin conexion"}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={loadStream}>
            <ThemedText type="small" style={{ color: Colors.dark.primary }}>
              Reintentar
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return <VideoPlayer streamUrl={streamUrl} onError={() => setStreamError(true)} />;
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.videoContainer} onPress={toggleControls}>
        {renderVideoPlayer()}
      </Pressable>

      {showControls ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}
        >
          <Pressable style={styles.backButton} onPress={handleClose} hitSlop={12}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={styles.topRight}>
            <View style={styles.cameraNameBadge}>
              <StatusDot isOnline={camera.isOnline} size={8} />
              <ThemedText type="small" style={styles.cameraNameText}>
                {camera.name}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      ) : null}

      {showControls ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[styles.bottomOverlay, { paddingBottom: insets.bottom + Spacing.sm }]}
        >
          <View style={styles.bottomContent}>
            {camera.supportsPTZ ? (
              <PTZJoystick onMove={handlePTZ} />
            ) : (
              <View style={styles.joystickPlaceholder} />
            )}

            <View style={styles.rightActions}>
              <ActionButton
                icon="film"
                onPress={handleShowRecordings}
                size={20}
              />
              <ActionButton
                icon={globalAudioMuted ? "mic-off" : "mic"}
                onPress={handleToggleAudio}
                size={20}
                active={!globalAudioMuted}
              />
              <ActionButton
                icon="camera"
                onPress={handleScreenshot}
                size={20}
              />
              <ActionButton
                icon="shield"
                onPress={() => setShowArmingPanel(true)}
                size={20}
                active={motionDetection || decibelDetection}
              />
            </View>
          </View>
        </Animated.View>
      ) : null}

      <BottomPanel
        title="Controles de armado"
        visible={showArmingPanel}
        onClose={() => setShowArmingPanel(false)}
      >
        {statusLoading ? (
          <ActivityIndicator size="small" color={Colors.dark.primary} style={{ padding: Spacing.xl }} />
        ) : (
          <View style={styles.armingList}>
            <Pressable style={styles.armingRow} onPress={handleToggleMotion}>
              <View style={styles.armingInfo}>
                <View style={[styles.armingIcon, motionDetection && styles.armingIconActive]}>
                  <Feather name="activity" size={18} color={motionDetection ? Colors.dark.primary : Colors.dark.textSecondary} />
                </View>
                <View style={styles.armingTextContainer}>
                  <ThemedText type="body" style={styles.armingLabel}>
                    Deteccion de movimiento
                  </ThemedText>
                  <ThemedText type="small" style={{ color: Colors.dark.textSecondary }}>
                    Notificaciones al detectar movimiento
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.togglePill, motionDetection && styles.togglePillActive]}>
                <ThemedText type="small" style={{ color: motionDetection ? Colors.dark.primary : Colors.dark.textSecondary, fontSize: 11 }}>
                  {motionDetection ? "ON" : "OFF"}
                </ThemedText>
              </View>
            </Pressable>

            <Pressable style={styles.armingRow} onPress={handleToggleDecibel}>
              <View style={styles.armingInfo}>
                <View style={[styles.armingIcon, decibelDetection && styles.armingIconActive]}>
                  <Feather name="mic" size={18} color={decibelDetection ? Colors.dark.primary : Colors.dark.textSecondary} />
                </View>
                <View style={styles.armingTextContainer}>
                  <ThemedText type="body" style={styles.armingLabel}>
                    Deteccion de sonido
                  </ThemedText>
                  <ThemedText type="small" style={{ color: Colors.dark.textSecondary }}>
                    Notificaciones al detectar ruido fuerte
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.togglePill, decibelDetection && styles.togglePillActive]}>
                <ThemedText type="small" style={{ color: decibelDetection ? Colors.dark.primary : Colors.dark.textSecondary, fontSize: 11 }}>
                  {decibelDetection ? "ON" : "OFF"}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        )}
      </BottomPanel>

      <BottomPanel
        title="Grabaciones en la nube"
        visible={showRecordingsPanel}
        onClose={() => setShowRecordingsPanel(false)}
      >
        {recordingsLoading ? (
          <ActivityIndicator size="small" color={Colors.dark.primary} style={{ padding: Spacing.xl }} />
        ) : recordingDates.length > 0 ? (
          <View style={styles.recordingsList}>
            {recordingDates.map((date, index) => (
              <View key={index} style={styles.recordingRow}>
                <Feather name="calendar" size={18} color={Colors.dark.primary} />
                <ThemedText type="body" style={styles.recordingDate}>{date}</ThemedText>
                <Feather name="play-circle" size={20} color={Colors.dark.textSecondary} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyRecordings}>
            <Feather name="cloud-off" size={40} color={Colors.dark.textSecondary} />
            <ThemedText type="body" style={{ color: Colors.dark.textSecondary, marginTop: Spacing.md }}>
              No hay grabaciones disponibles
            </ThemedText>
            <ThemedText type="small" style={{ color: Colors.dark.textSecondary, marginTop: Spacing.xs, textAlign: "center" }}>
              Las grabaciones requieren suscripcion al almacenamiento en la nube de Smart Life
            </ThemedText>
          </View>
        )}
      </BottomPanel>
    </View>
  );
}

const JOYSTICK_SIZE = 110;
const KNOB_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cameraNameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  cameraNameText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  bottomContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  joystickContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  joystickPlaceholder: {
    width: JOYSTICK_SIZE,
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  joystickDirections: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  dirUp: {
    position: "absolute",
    top: 8,
  },
  dirDown: {
    position: "absolute",
    bottom: 8,
  },
  dirLeft: {
    position: "absolute",
    left: 8,
  },
  dirRight: {
    position: "absolute",
    right: 8,
  },
  joystickKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  rightActions: {
    gap: Spacing.md,
    alignItems: "center",
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnActive: {
    backgroundColor: "rgba(0,188,212,0.15)",
    borderColor: Colors.dark.primary,
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 10,
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "60%",
    paddingBottom: Spacing.xl,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  panelTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  panelContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  armingList: {
    gap: Spacing.xs,
  },
  armingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  armingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  armingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  armingIconActive: {
    backgroundColor: "rgba(0,188,212,0.15)",
  },
  armingTextContainer: {
    flex: 1,
  },
  armingLabel: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  togglePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundTertiary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  togglePillActive: {
    backgroundColor: "rgba(0,188,212,0.15)",
    borderColor: Colors.dark.primary,
  },
  recordingsList: {
    gap: Spacing.xs,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  recordingDate: {
    flex: 1,
    color: "#FFFFFF",
  },
  emptyRecordings: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
});
