import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera, User } from "@/types/camera";

const STORAGE_KEYS = {
  USER: "@smartcam:user",
  CAMERAS: "@smartcam:cameras",
  GRID_COLUMNS: "@smartcam:gridColumns",
  REMEMBER_ME: "@smartcam:rememberMe",
  CREDENTIALS: "@smartcam:credentials",
  BIOMETRIC_ENABLED: "@smartcam:biometricEnabled",
  AUDIO_MUTED: "@smartcam:audioMuted",
  GLOBAL_AUDIO_MUTED: "@smartcam:globalAudioMuted",
};

export async function getUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setUser(user: User | null): Promise<void> {
  try {
    if (user) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch (error) {
    console.error("Failed to save user:", error);
  }
}

export async function getCameras(): Promise<Camera[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CAMERAS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function setCameras(cameras: Camera[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CAMERAS, JSON.stringify(cameras));
  } catch (error) {
    console.error("Failed to save cameras:", error);
  }
}

export async function addCamera(camera: Camera): Promise<void> {
  const cameras = await getCameras();
  cameras.push(camera);
  await setCameras(cameras);
}

export async function removeCamera(cameraId: string): Promise<void> {
  const cameras = await getCameras();
  const filtered = cameras.filter((c) => c.id !== cameraId);
  await setCameras(filtered);
}

export async function getGridColumns(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GRID_COLUMNS);
    return data ? parseInt(data, 10) : 2;
  } catch {
    return 2;
  }
}

export async function setGridColumns(columns: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GRID_COLUMNS, columns.toString());
  } catch (error) {
    console.error("Failed to save grid columns:", error);
  }
}

export async function getRememberMe(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return data === "true";
  } catch {
    return false;
  }
}

export async function setRememberMe(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, value.toString());
  } catch (error) {
    console.error("Failed to save remember me:", error);
  }
}

export async function getSavedCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setSavedCredentials(
  email: string,
  password: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.CREDENTIALS,
      JSON.stringify({ email, password }),
    );
  } catch (error) {
    console.error("Failed to save credentials:", error);
  }
}

export async function clearSavedCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
  } catch (error) {
    console.error("Failed to clear credentials:", error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.CAMERAS,
      STORAGE_KEYS.GRID_COLUMNS,
    ]);
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}

export async function getBiometricEnabled(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return data === "true";
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
  } catch (error) {
    console.error("Failed to save biometric setting:", error);
  }
}

export async function getGlobalAudioMuted(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_AUDIO_MUTED);
    return data === "true";
  } catch {
    return true;
  }
}

export async function setGlobalAudioMuted(muted: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_AUDIO_MUTED, muted.toString());
  } catch (error) {
    console.error("Failed to save audio muted setting:", error);
  }
}
