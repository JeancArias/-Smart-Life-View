import crypto from "crypto";

const TUYA_BASE_URL = "https://openapi.tuyaeu.com"; // Europe region

interface TuyaConfig {
  accessId: string;
  accessSecret: string;
}

interface TuyaTokenResponse {
  result: {
    access_token: string;
    expire_time: number;
    refresh_token: string;
    uid: string;
  };
  success: boolean;
  t: number;
  msg?: string;
}

interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  product_id: string;
  product_name: string;
  online: boolean;
  icon: string;
  ip: string;
  time_zone: string;
  active_time: number;
  update_time: number;
  create_time: number;
  local_key: string;
  sub: boolean;
  uuid: string;
}

interface TuyaDevicesResponse {
  result: TuyaDevice[];
  success: boolean;
  t: number;
  msg?: string;
}

interface TuyaUserDevicesResponse {
  result: {
    devices: TuyaDevice[];
    total: number;
    has_more: boolean;
  };
  success: boolean;
  t: number;
  msg?: string;
}

interface TuyaCameraUrlResponse {
  result: {
    url: string;
  };
  success: boolean;
  t: number;
  msg?: string;
}

interface TuyaUsersResponse {
  result: {
    list: Array<{
      uid: string;
      nick_name: string;
      avatar: string;
      country_code: string;
    }>;
    total: number;
  };
  success: boolean;
  t: number;
  msg?: string;
}

class TuyaClient {
  private config: TuyaConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private uid: string | null = null;

  constructor(config: TuyaConfig) {
    this.config = config;
  }

  private generateSign(
    method: string,
    path: string,
    timestamp: string,
    accessToken?: string,
    body?: string,
  ): string {
    const contentHash = crypto
      .createHash("sha256")
      .update(body || "")
      .digest("hex");

    const stringToSign = [
      method.toUpperCase(),
      contentHash,
      "",
      path,
    ].join("\n");

    const signStr = accessToken
      ? this.config.accessId + accessToken + timestamp + stringToSign
      : this.config.accessId + timestamp + stringToSign;

    const sign = crypto
      .createHmac("sha256", this.config.accessSecret)
      .update(signStr)
      .digest("hex")
      .toUpperCase();

    return sign;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requiresAuth: boolean = true,
  ): Promise<T> {
    if (requiresAuth && (!this.accessToken || Date.now() > this.tokenExpiry)) {
      await this.refreshToken();
    }

    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : "";
    const sign = this.generateSign(
      method,
      path,
      timestamp,
      requiresAuth ? this.accessToken || undefined : undefined,
      bodyStr,
    );

    const headers: Record<string, string> = {
      client_id: this.config.accessId,
      sign: sign,
      t: timestamp,
      sign_method: "HMAC-SHA256",
      "Content-Type": "application/json",
    };

    if (requiresAuth && this.accessToken) {
      headers.access_token = this.accessToken;
    }

    const url = `${TUYA_BASE_URL}${path}`;
    console.log(`Tuya API Request: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? bodyStr : undefined,
    });

    const data = await response.json();
    console.log(`Tuya API Response:`, JSON.stringify(data).substring(0, 500));

    if (!data.success) {
      throw new Error(data.msg || `Tuya API error: ${JSON.stringify(data)}`);
    }

    return data as T;
  }

  private async refreshToken(): Promise<void> {
    const path = "/v1.0/token?grant_type=1";
    const response = await this.request<TuyaTokenResponse>(
      "GET",
      path,
      undefined,
      false,
    );

    this.accessToken = response.result.access_token;
    this.tokenExpiry = Date.now() + response.result.expire_time * 1000 - 60000;
    this.uid = response.result.uid;
    console.log("Token refreshed, UID:", this.uid);
  }

  async getDeviceById(deviceId: string): Promise<TuyaDevice | null> {
    try {
      const path = `/v1.0/devices/${deviceId}`;
      const response = await this.request<{ result: TuyaDevice }>("GET", path);
      return response.result || null;
    } catch (error) {
      console.error(`Error fetching device ${deviceId}:`, error);
      return null;
    }
  }

  async getDevices(): Promise<TuyaDevice[]> {
    // First try to auto-discover devices using the UID
    try {
      if (!this.accessToken || Date.now() > this.tokenExpiry) {
        await this.refreshToken();
      }

      if (this.uid) {
        console.log("Auto-discovering devices for UID:", this.uid);
        try {
          const path = `/v1.0/users/${this.uid}/devices`;
          const response = await this.request<TuyaDevicesResponse>("GET", path);
          if (response.result && Array.isArray(response.result) && response.result.length > 0) {
            console.log(`Auto-discovered ${response.result.length} devices`);
            return response.result;
          }
        } catch (error) {
          console.log("Auto-discovery not available, falling back to configured IDs");
        }
      }
    } catch (error) {
      console.log("Token refresh failed for auto-discovery");
    }

    // Fallback: Use configured device IDs from environment
    const deviceIdsEnv = process.env.TUYA_DEVICE_IDS;
    
    if (deviceIdsEnv) {
      const deviceIds = deviceIdsEnv.split(",").map(id => id.trim()).filter(id => id);
      console.log(`Fetching ${deviceIds.length} configured devices...`);
      
      const devices: TuyaDevice[] = [];
      for (const deviceId of deviceIds) {
        const device = await this.getDeviceById(deviceId);
        if (device) {
          devices.push(device);
        }
      }
      console.log(`Found ${devices.length} devices`);
      return devices;
    }

    console.log("No devices found - please configure TUYA_DEVICE_IDS");
    return [];
  }

  async getCameraDevices(): Promise<TuyaDevice[]> {
    const devices = await this.getDevices();
    const cameras = devices.filter(
      (device) =>
        device.category === "sp" || // Smart camera
        device.category === "ipc" || // IP camera
        device.category === "dghd" || // Doorbell
        device.category === "camera", // Generic camera
    );
    console.log(`Found ${cameras.length} cameras out of ${devices.length} devices`);
    return cameras;
  }

  async getCameraStreamUrl(deviceId: string): Promise<string | null> {
    try {
      // Try HLS stream first
      const path = `/v1.0/devices/${deviceId}/stream/actions/allocate`;
      const response = await this.request<TuyaCameraUrlResponse>("POST", path, {
        type: "hls",
      });
      return response.result?.url || null;
    } catch (error) {
      console.error("Error getting HLS stream URL:", error);
      
      // Try RTSP as fallback
      try {
        const rtspPath = `/v1.0/devices/${deviceId}/stream/actions/allocate`;
        const rtspResponse = await this.request<TuyaCameraUrlResponse>("POST", rtspPath, {
          type: "rtsp",
        });
        return rtspResponse.result?.url || null;
      } catch (rtspError) {
        console.error("Error getting RTSP stream URL:", rtspError);
        return null;
      }
    }
  }

  async getDeviceStatus(deviceId: string): Promise<unknown> {
    try {
      const path = `/v1.0/devices/${deviceId}/status`;
      const response = await this.request<{ result: unknown }>("GET", path);
      return response.result;
    } catch (error) {
      console.error("Error getting device status:", error);
      return null;
    }
  }

  async controlPTZ(
    deviceId: string,
    direction: "up" | "down" | "left" | "right",
  ): Promise<boolean> {
    try {
      const ptzCommands: Record<string, string> = {
        up: "0",
        down: "4",
        left: "6",
        right: "2",
      };

      const path = `/v1.0/devices/${deviceId}/commands`;
      await this.request("POST", path, {
        commands: [
          {
            code: "ptz_control",
            value: ptzCommands[direction],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error("Error controlling PTZ:", error);
      return false;
    }
  }

  async sendCommand(deviceId: string, code: string, value: unknown): Promise<boolean> {
    try {
      const path = `/v1.0/devices/${deviceId}/commands`;
      await this.request("POST", path, {
        commands: [{ code, value }],
      });
      return true;
    } catch (error) {
      console.error(`Error sending command ${code}:`, error);
      return false;
    }
  }

  async getCloudRecordDates(deviceId: string): Promise<string[]> {
    try {
      const path = `/v1.0/devices/${deviceId}/ipc/playback/get-dates`;
      const response = await this.request<{ result: string[] }>("GET", path);
      return response.result || [];
    } catch (error) {
      console.error("Error getting cloud record dates:", error);
      return [];
    }
  }

  async getCloudRecordEvents(
    deviceId: string,
    startTime: number,
    endTime: number,
  ): Promise<unknown[]> {
    try {
      const path = `/v1.0/devices/${deviceId}/ipc/playback/video?start_time=${startTime}&end_time=${endTime}`;
      const response = await this.request<{ result: { datas: unknown[] } }>("GET", path);
      return response.result?.datas || [];
    } catch (error) {
      console.error("Error getting cloud recordings:", error);
      return [];
    }
  }
}

let tuyaClient: TuyaClient | null = null;

export function getTuyaClient(): TuyaClient {
  if (!tuyaClient) {
    const accessId = process.env.TUYA_ACCESS_ID;
    const accessSecret = process.env.TUYA_ACCESS_SECRET;

    if (!accessId || !accessSecret) {
      throw new Error("Tuya credentials not configured");
    }

    tuyaClient = new TuyaClient({
      accessId,
      accessSecret,
    });
  }

  return tuyaClient;
}

export type { TuyaDevice };
