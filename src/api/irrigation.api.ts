import * as base from 'api/base.api';
import { IRRIGATION, HEALTH_CHECK } from 'api/routes';
import { CreateScheduleParams } from 'hooks/useIrrigation.hook';

export const fetchSchedules = async (zoneId?: number, subzoneId?: number) => {
  return base.get(`${IRRIGATION}/schedules`, { zoneId, subzoneId });
};

export const createSchedule = async (data: CreateScheduleParams) => {
  return base.put(`${IRRIGATION}/schedules`, data as unknown as Record<string, unknown>);
};

export const updateSchedule = async (id: number, data: CreateScheduleParams) => {
  return base.put(`${IRRIGATION}/schedules/${id}`, data as unknown as Record<string, unknown>);
};

export const deleteSchedule = async (id: number) => {
  return base.del(`${IRRIGATION}/schedules/${id}`);
};

export const toggleSchedule = async (id: number, active: boolean) => {
  return base.post(`${IRRIGATION}/schedules/${id}/toggle`, { active });
};

export const fetchZones = async (zoneTypeId?: number) => {
  return base.get(`${IRRIGATION}/zones`, { zoneTypeId });
};

export const fetchZoneTypes = async () => {
  return base.get(`${IRRIGATION}/zones/types`);
};

export const checkScheduleSync = async () => {
  return base.get(`${IRRIGATION}/schedules/sync-status`);
};

export const forceScheduleSync = async () => {
  return base.post(`${IRRIGATION}/schedules/sync`, {});
};

export const reorderSchedules = async (ids: number[]) => {
  return base.put(`${IRRIGATION}/schedules/reorder`, { ids } as unknown as Record<string, unknown>);
};

export const healthCheck = async () => {
  return base.get(HEALTH_CHECK);
};
