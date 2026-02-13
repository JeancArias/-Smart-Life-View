import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { getTuyaClient, type TuyaDevice } from "./tuya-client";

interface Camera {
  id: string;
  name: string;
  deviceId: string;
  isOnline: boolean;
  thumbnailUrl?: string;
  streamUrl?: string;
  supportsPTZ: boolean;
  lastSeen: string;
  category: string;
}

function mapTuyaDeviceToCamera(device: TuyaDevice): Camera {
  return {
    id: device.id,
    name: device.name || device.product_name || "Camera",
    deviceId: device.uuid || device.id,
    isOnline: device.online,
    supportsPTZ: device.category === "sp" || device.category === "ipc",
    lastSeen: new Date(device.update_time * 1000).toISOString(),
    category: device.category,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/cameras", async (req: Request, res: Response) => {
    try {
      const client = getTuyaClient();
      const devices = await client.getCameraDevices();
      const cameras = devices.map(mapTuyaDeviceToCamera);
      
      // Include stream URLs if requested (for live preview)
      const includeStreams = req.query.includeStreams === "true";
      
      if (includeStreams) {
        const camerasWithStreams = await Promise.all(
          cameras.map(async (camera) => {
            if (camera.isOnline) {
              try {
                const streamUrl = await client.getCameraStreamUrl(camera.id);
                return { ...camera, streamUrl };
              } catch (error) {
                return camera;
              }
            }
            return camera;
          })
        );
        return res.json({ cameras: camerasWithStreams });
      }
      
      res.json({ cameras });
    } catch (error) {
      console.error("Error fetching cameras:", error);
      res.status(500).json({ error: "Failed to fetch cameras" });
    }
  });

  app.get("/api/cameras/:deviceId/stream", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const client = getTuyaClient();
      const streamUrl = await client.getCameraStreamUrl(deviceId);

      if (!streamUrl) {
        return res.status(404).json({ error: "Stream not available" });
      }

      res.json({ streamUrl });
    } catch (error) {
      console.error("Error getting stream URL:", error);
      res.status(500).json({ error: "Failed to get stream URL" });
    }
  });

  app.get("/api/cameras/:deviceId/status", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const client = getTuyaClient();
      const status = await client.getDeviceStatus(deviceId);
      res.json({ status });
    } catch (error) {
      console.error("Error getting device status:", error);
      res.status(500).json({ error: "Failed to get device status" });
    }
  });

  app.post("/api/cameras/:deviceId/ptz", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const { direction } = req.body;

      if (!["up", "down", "left", "right"].includes(direction)) {
        return res.status(400).json({ error: "Invalid direction" });
      }

      const client = getTuyaClient();
      const success = await client.controlPTZ(deviceId, direction);

      if (!success) {
        return res.status(500).json({ error: "Failed to control PTZ" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error controlling PTZ:", error);
      res.status(500).json({ error: "Failed to control PTZ" });
    }
  });

  app.post("/api/cameras/:deviceId/command", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const { code, value } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Command code is required" });
      }

      const client = getTuyaClient();
      const success = await client.sendCommand(deviceId, code, value);

      if (!success) {
        return res.status(500).json({ error: "Failed to send command" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending command:", error);
      res.status(500).json({ error: "Failed to send command" });
    }
  });

  app.get("/api/cameras/:deviceId/recordings/dates", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const client = getTuyaClient();
      const dates = await client.getCloudRecordDates(deviceId);
      res.json({ dates });
    } catch (error) {
      console.error("Error getting recording dates:", error);
      res.status(500).json({ error: "Failed to get recording dates" });
    }
  });

  app.get("/api/cameras/:deviceId/recordings", async (req: Request, res: Response) => {
    try {
      const deviceId = req.params.deviceId as string;
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }

      const client = getTuyaClient();
      const events = await client.getCloudRecordEvents(
        deviceId,
        parseInt(startTime as string, 10),
        parseInt(endTime as string, 10),
      );
      res.json({ events });
    } catch (error) {
      console.error("Error getting recordings:", error);
      res.status(500).json({ error: "Failed to get recordings" });
    }
  });

  app.get("/api/devices", async (_req: Request, res: Response) => {
    try {
      const client = getTuyaClient();
      const devices = await client.getDevices();
      res.json({ devices });
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
