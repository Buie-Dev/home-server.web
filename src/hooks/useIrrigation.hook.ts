import { useEffect, useState } from 'react';
import * as irrigationApi from 'api/irrigation.api';
import { useWebSocket, CurrentState, CurrentQueueState } from 'context/WebSocketContext';

export type ZoneDetail = {
  id: number;
  name: string;
  zone: number;
  type: string;
  subzones?: SubZoneDetail[];
};

export type SubZoneDetail = {
  id: number;
  name: string;
  subzone: number;
};

export type Subzone = {
  id: number;
  name: string;
  subzone: number;
  state: boolean;
};

export type Zone = {
  id: number;
  name: string;
  state: boolean;
  zone: number;
  type: string;
  subzones?: Subzone[];
};

export type PriorityQueue = {
  id: string;
  name: string;
  duration: number;
  zone: number;
  zoneType: string;
  priority: number;
  startTime?: number;
  subZones?: Array<QueueSubzone>;
};

export type QueueSubzone = {
  id: number;
  name: string;
  zone: number;
};

export type Schedule = {
  id: number;
  name: string;
  startTime: string;
  duration: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  subzoneNames?: string;
  subzoneIds: number[];
  zoneName: string;
  zoneId: number;
  active: boolean;
  sortOrder: number;
};

export type CreateScheduleParams = {
  name: string;
  startTime: string;
  duration: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  zoneId: number;
  subzoneIds?: Array<number>;
};

export type ZoneType = {
  id: number;
  type: string;
};

export type SyncStatus = {
  in_sync: boolean;
  missing_from_automation: number[];
  mismatched: { id: number; diffs: string[] }[];
  extra_in_automation: number[];
  error?: string;
  timeout?: boolean;
};

interface IrrigationInfo {
  fetchZones: (zoneTypeId?: number) => void;
  healthCheck: () => void;
  stopAll: () => void;
  stopQueueItem: (id: string) => void;
  fetchSchedules: (zoneId?: number, subzoneId?: number) => void;
  createSchedule: (data: CreateScheduleParams) => Promise<void>;
  updateSchedule: (id: number, data: CreateScheduleParams) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
  toggleSchedule: (id: number, active: boolean) => Promise<void>;
  reorderSchedules: (ids: number[]) => Promise<void>;
  fetchZoneTypes: () => void;
  checkSync: () => Promise<SyncStatus | null>;
  forceSync: () => Promise<{ synced: number } | null>;
  zones: Array<Zone>;
  priorityQueue: Array<PriorityQueue>;
  schedules: Array<Schedule>;
  zoneTypes: Array<ZoneType>;
  zoneDetails: Array<ZoneDetail>;
  connected: boolean;
}

function useIrrigation(): IrrigationInfo {
  const { latestCurrentQueueStates, latestCurrentStates, sendMessage } = useWebSocket();

  const [zoneDetails, setZoneDetails] = useState<Array<ZoneDetail>>([]);
  const [zones, setZones] = useState<Array<Zone>>([]);
  const [schedules, setSchedules] = useState<Array<Schedule>>([]);
  const [priorityQueue, setPriorityQueue] = useState<Array<PriorityQueue>>([]);
  const [zoneTypes, setZoneTypes] = useState<Array<ZoneType>>([]);
  const [connected, setConnected] = useState(false);

  const fetchZoneTypes = async (): Promise<void> => {
    try {
      const data = await irrigationApi.fetchZoneTypes();
      setZoneTypes(data as Array<ZoneType>);
    } catch (error) {
      console.error(error);
    }
  };

  const formatZones = (currentStates: Array<CurrentState>, details: Array<ZoneDetail>): Array<Zone> => {
    if (!currentStates.length || !details.length) return [];

    const result: Array<Zone> = [];
    for (const detail of details) {
      const currentState = currentStates.find((state) => state.id === detail.zone);
      if (!currentState) continue;

      const zone: Zone = {
        id: detail.id,
        name: detail.name,
        zone: detail.zone,
        type: detail.type,
        state: !!currentState.state,
      };

      if (currentState.subzones && detail.subzones) {
        for (const detailSubzone of detail.subzones) {
          const latestSubzone = currentState.subzones.find((sub) => sub.id === detailSubzone.subzone);
          if (!latestSubzone) continue;
          if (!zone.subzones) zone.subzones = [];
          zone.subzones.push({
            id: detailSubzone.id,
            name: detailSubzone.name,
            subzone: detailSubzone.subzone,
            state: !!latestSubzone.state,
          });
        }
      }
      result.push(zone);
    }
    return result;
  };

  const formatQueue = (queueStates: Array<CurrentQueueState>, details: Array<ZoneDetail>): Array<PriorityQueue> => {
    if (!queueStates.length || !details.length) return [];

    const result: Array<PriorityQueue> = [];
    for (const queueState of queueStates) {
      const detail = details.find((zd) => zd.zone === queueState.zone);
      if (!detail) continue;

      const subZones: Array<QueueSubzone> = [];
      if (queueState.subzones && detail.subzones) {
        for (const subState of queueState.subzones) {
          const subZone = detail.subzones.find((sub) => sub.subzone === subState.id);
          if (!subZone) continue;
          subZones.push({ name: subZone.name, id: subState.id, zone: subZone.subzone });
        }
      }

      result.push({
        id: queueState.id,
        duration: queueState.duration,
        zone: queueState.zone,
        name: detail.name,
        zoneType: detail.type,
        priority: queueState.priority,
        subZones: subZones.length > 0 ? subZones : undefined,
        startTime: queueState.start_time ? parseInt(queueState.start_time) : undefined,
      });
    }
    return result;
  };

  const stopAll = (): void => {
    sendMessage('stopAll', {});
  };

  const stopQueueItem = (id: string): void => {
    sendMessage('stop', { id });
  };

  const fetchSchedules = async (zoneId?: number, subzoneId?: number): Promise<void> => {
    try {
      const data = await irrigationApi.fetchSchedules(zoneId, subzoneId);
      setSchedules(data as Array<Schedule>);
    } catch (error) {
      console.error(error);
    }
  };

  const createSchedule = async (data: CreateScheduleParams): Promise<void> => {
    try {
      await irrigationApi.createSchedule(data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateSchedule = async (id: number, data: CreateScheduleParams): Promise<void> => {
    try {
      await irrigationApi.updateSchedule(id, data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSchedule = async (id: number): Promise<void> => {
    try {
      await irrigationApi.deleteSchedule(id);
    } catch (error) {
      console.error(error);
    }
  };

  const checkSync = async (): Promise<SyncStatus | null> => {
    try {
      return (await irrigationApi.checkScheduleSync()) as SyncStatus;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const forceSync = async (): Promise<{ synced: number } | null> => {
    try {
      return (await irrigationApi.forceScheduleSync()) as { synced: number };
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const toggleSchedule = async (id: number, active: boolean): Promise<void> => {
    try {
      await irrigationApi.toggleSchedule(id, active);
      await fetchSchedules();
    } catch (error) {
      console.error(error);
    }
  };

  const reorderSchedules = async (ids: number[]): Promise<void> => {
    try {
      await irrigationApi.reorderSchedules(ids);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchZones = async (zoneTypeId?: number): Promise<void> => {
    try {
      const data = await irrigationApi.fetchZones(zoneTypeId);
      setZoneDetails(data as Array<ZoneDetail>);
    } catch (error) {
      console.error(error);
    }
  };

  const healthCheck = async (): Promise<void> => {
    try {
      await irrigationApi.healthCheck();
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchZones();
    healthCheck();
    const intervalId = setInterval(healthCheck, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setPriorityQueue(formatQueue(latestCurrentQueueStates, zoneDetails));
  }, [latestCurrentQueueStates, zoneDetails]);

  useEffect(() => {
    setZones(formatZones(latestCurrentStates, zoneDetails));
  }, [latestCurrentStates, zoneDetails]);

  return {
    fetchZones,
    stopAll,
    stopQueueItem,
    deleteSchedule,
    createSchedule,
    updateSchedule,
    fetchSchedules,
    toggleSchedule,
    reorderSchedules,
    checkSync,
    forceSync,
    schedules,
    zones,
    priorityQueue,
    fetchZoneTypes,
    zoneTypes,
    zoneDetails,
    healthCheck,
    connected,
  };
}

export default useIrrigation;
