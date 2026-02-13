export interface Camera {
  id: string;
  name: string;
  deviceId: string;
  isOnline: boolean;
  thumbnailUrl?: string;
  streamUrl?: string;
  supportsPTZ: boolean;
  lastSeen: string;
}

export interface DeviceStatus {
  code: string;
  value: unknown;
}

export interface RecordingEvent {
  startTime: number;
  endTime: number;
  snapshotUrl?: string;
  eventType?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  camerasCount: number;
}

export interface GridLayout {
  columns: number;
  label: string;
}

export const GRID_LAYOUTS: GridLayout[] = [
  { columns: 1, label: "1x1" },
  { columns: 2, label: "2x2" },
  { columns: 3, label: "3x3" },
  { columns: 4, label: "4x4" },
];
