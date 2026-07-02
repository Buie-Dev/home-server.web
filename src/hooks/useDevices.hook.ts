import { useEffect, useRef, useState } from 'react';
import * as devicesApi from 'api/devices.api';
import { useWebSocket } from 'context/WebSocketContext';

export type Device = {
  id: string;
  name: string;
  description: string;
  type: string;
  healthCheckResponse: string;
};

export type DeviceWithStatus = Device & {
  status: 'online' | 'offline' | 'checking';
  lastChecked: Date | null;
  responseTimeMs?: number;
};

interface DevicesInfo {
  devices: DeviceWithStatus[];
  fetchDevices: () => Promise<void>;
  checkConnectivity: () => void;
  loading: boolean;
}

const HEALTH_CHECK_TIMEOUT_MS = 5000;

function useDevices(): DevicesInfo {
  const { sendMessage, latestHealthCheckResponses, isConnected } = useWebSocket();
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const pingTimestampsRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDevices = async (): Promise<void> => {
    setLoading(true);
    setDevices([]);
    try {
      const data = await devicesApi.fetchDeviceStatus();
      const withStatus: DeviceWithStatus[] = (Array.isArray(data) ? (data as Device[]) : []).map((device) => ({
        ...device,
        status: 'checking',
        lastChecked: null,
      }));
      setDevices(withStatus);
    } catch (error) {
      console.error(error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectivity = (): void => {
    if (!isConnected || devices.length === 0) return;

    const now = Date.now();
    pingTimestampsRef.current = Object.fromEntries(devices.map((device) => [device.id, now]));

    setDevices((prev) => prev.map((device) => ({ ...device, status: 'checking' })));

    sendMessage('healthcheck/request', {});

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDevices((prev) =>
        prev.map((device) => (device.status === 'checking' ? { ...device, status: 'offline', lastChecked: new Date() } : device))
      );
    }, HEALTH_CHECK_TIMEOUT_MS);
  };

  useEffect(() => {
    if (latestHealthCheckResponses.length === 0) return;

    setDevices((prev) =>
      prev.map((device) => {
        const sentAt = pingTimestampsRef.current[device.id];
        if (sentAt === undefined) return device;

        const response = latestHealthCheckResponses.find((resp) => resp.deviceId === device.id);
        if (!response || !response.timestamp || response.timestamp < sentAt) return device;

        const isHealthy = response.status === device.healthCheckResponse;
        const responseTimeMs = Date.now() - sentAt;

        return {
          ...device,
          status: isHealthy ? 'online' : 'offline',
          lastChecked: new Date(),
          responseTimeMs,
        };
      })
    );
  }, [latestHealthCheckResponses]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { devices, fetchDevices, checkConnectivity, loading };
}

export default useDevices;
