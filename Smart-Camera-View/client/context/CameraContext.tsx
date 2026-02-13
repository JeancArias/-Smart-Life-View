import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Camera, DeviceStatus } from "@/types/camera";
import {
  getGridColumns,
  setGridColumns as saveGridColumns,
  getGlobalAudioMuted,
  setGlobalAudioMuted as saveGlobalAudioMuted,
} from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "./AuthContext";

interface CameraContextType {
  cameras: Camera[];
  isLoading: boolean;
  gridColumns: number;
  setGridColumns: (columns: number) => Promise<void>;
  refreshCameras: () => Promise<void>;
  getCameraStreamUrl: (deviceId: string) => Promise<string | null>;
  controlPTZ: (deviceId: string, direction: string) => Promise<boolean>;
  sendCommand: (deviceId: string, code: string, value: unknown) => Promise<boolean>;
  getDeviceStatus: (deviceId: string) => Promise<DeviceStatus[]>;
  getRecordingDates: (deviceId: string) => Promise<string[]>;
  getRecordingEvents: (deviceId: string, startTime: number, endTime: number) => Promise<unknown[]>;
  globalAudioMuted: boolean;
  setGlobalAudioMuted: (muted: boolean) => Promise<void>;
  error: string | null;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridColumns, setGridColumnsState] = useState(2);
  const [globalAudioMuted, setGlobalAudioMutedState] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async (includeStreams: boolean = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/cameras", baseUrl);
      if (includeStreams) {
        url.searchParams.set("includeStreams", "true");
      }
      const response = await fetch(url.href);
      
      if (!response.ok) {
        throw new Error("Error al obtener camaras");
      }
      
      const data = await response.json();
      setCameras(data.cameras || []);
    } catch (err) {
      console.error("Failed to fetch cameras:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setCameras([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      setCameras([]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  async function loadInitialData() {
    const [columns, audioMuted] = await Promise.all([
      getGridColumns(),
      getGlobalAudioMuted(),
    ]);
    setGridColumnsState(columns);
    setGlobalAudioMutedState(audioMuted);
    await fetchCameras();
  }

  async function setGridColumns(columns: number) {
    setGridColumnsState(columns);
    await saveGridColumns(columns);
  }

  async function refreshCameras() {
    await fetchCameras();
  }

  async function getCameraStreamUrl(deviceId: string): Promise<string | null> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/cameras/${deviceId}/stream`, baseUrl).href
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.streamUrl || null;
    } catch (err) {
      console.error("Failed to get stream URL:", err);
      return null;
    }
  }

  async function controlPTZ(deviceId: string, direction: string): Promise<boolean> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/cameras/${deviceId}/ptz`, baseUrl).href,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        }
      );
      
      return response.ok;
    } catch (err) {
      console.error("Failed to control PTZ:", err);
      return false;
    }
  }

  async function sendCommand(deviceId: string, code: string, value: unknown): Promise<boolean> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/cameras/${deviceId}/command`, baseUrl).href,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, value }),
        }
      );
      return response.ok;
    } catch (err) {
      console.error("Failed to send command:", err);
      return false;
    }
  }

  async function getDeviceStatus(deviceId: string): Promise<DeviceStatus[]> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/cameras/${deviceId}/status`, baseUrl).href
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (data.status as DeviceStatus[]) || [];
    } catch (err) {
      console.error("Failed to get device status:", err);
      return [];
    }
  }

  async function getRecordingDates(deviceId: string): Promise<string[]> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/cameras/${deviceId}/recordings/dates`, baseUrl).href
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.dates || [];
    } catch (err) {
      console.error("Failed to get recording dates:", err);
      return [];
    }
  }

  async function getRecordingEvents(deviceId: string, startTime: number, endTime: number): Promise<unknown[]> {
    try {
      const baseUrl = getApiUrl();
      const url = new URL(`/api/cameras/${deviceId}/recordings`, baseUrl);
      url.searchParams.set("startTime", startTime.toString());
      url.searchParams.set("endTime", endTime.toString());
      const response = await fetch(url.href);
      if (!response.ok) return [];
      const data = await response.json();
      return data.events || [];
    } catch (err) {
      console.error("Failed to get recordings:", err);
      return [];
    }
  }

  async function setGlobalAudioMuted(muted: boolean) {
    setGlobalAudioMutedState(muted);
    await saveGlobalAudioMuted(muted);
  }

  return (
    <CameraContext.Provider
      value={{
        cameras,
        isLoading,
        gridColumns,
        setGridColumns,
        refreshCameras,
        getCameraStreamUrl,
        controlPTZ,
        sendCommand,
        getDeviceStatus,
        getRecordingDates,
        getRecordingEvents,
        globalAudioMuted,
        setGlobalAudioMuted,
        error,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCameras() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error("useCameras must be used within CameraProvider");
  }
  return context;
}
