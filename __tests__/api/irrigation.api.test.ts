vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  fetchZones,
  fetchZoneTypes,
  checkScheduleSync,
  forceScheduleSync,
  reorderSchedules,
  healthCheck,
} from 'api/irrigation.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('irrigation.api', () => {
  describe('fetchSchedules', () => {
    it('calls get with schedules endpoint', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchSchedules();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules'), {
        zoneId: undefined,
        subzoneId: undefined,
      });
    });

    it('passes zone and subzone filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchSchedules(1, 2);
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules'), {
        zoneId: 1,
        subzoneId: 2,
      });
    });
  });

  describe('createSchedule', () => {
    it('puts to schedules endpoint', async () => {
      mockedPut.mockResolvedValue(undefined);
      const data = {
        name: 'Test',
        startTime: '06:00',
        duration: 10,
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        zoneId: 1,
      };
      await createSchedule(data);
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/irrigations/schedules'),
        expect.objectContaining({ name: 'Test' })
      );
    });
  });

  describe('updateSchedule', () => {
    it('puts to schedules/:id endpoint', async () => {
      mockedPut.mockResolvedValue(undefined);
      const data = {
        name: 'Updated',
        startTime: '07:00',
        duration: 15,
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        zoneId: 1,
      };
      await updateSchedule(5, data);
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/irrigations/schedules/5'),
        expect.objectContaining({ name: 'Updated' })
      );
    });
  });

  describe('deleteSchedule', () => {
    it('deletes schedules/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteSchedule(3);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules/3'));
    });
  });

  describe('toggleSchedule', () => {
    it('posts to schedules/:id/toggle', async () => {
      mockedPost.mockResolvedValue(undefined);
      await toggleSchedule(2, true);
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules/2/toggle'), {
        active: true,
      });
    });
  });

  describe('fetchZones', () => {
    it('calls get with zones endpoint', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchZones();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/zones'), { zoneTypeId: undefined });
    });

    it('passes zoneTypeId filter', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchZones(2);
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/zones'), { zoneTypeId: 2 });
    });
  });

  describe('fetchZoneTypes', () => {
    it('calls get with zones/types endpoint', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchZoneTypes();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/zones/types'));
    });
  });

  describe('checkScheduleSync', () => {
    it('calls get with sync-status endpoint', async () => {
      mockedGet.mockResolvedValue({ in_sync: true });
      await checkScheduleSync();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules/sync-status'));
    });
  });

  describe('forceScheduleSync', () => {
    it('posts to sync endpoint', async () => {
      mockedPost.mockResolvedValue({ synced: 3 });
      await forceScheduleSync();
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/irrigations/schedules/sync'), {});
    });
  });

  describe('reorderSchedules', () => {
    it('puts to reorder endpoint with ids', async () => {
      mockedPut.mockResolvedValue(undefined);
      await reorderSchedules([3, 1, 2]);
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/irrigations/schedules/reorder'),
        expect.objectContaining({ ids: [3, 1, 2] })
      );
    });
  });

  describe('healthCheck', () => {
    it('calls get on base API url', async () => {
      mockedGet.mockResolvedValue({ status: 'ok' });
      await healthCheck();
      expect(mockedGet).toHaveBeenCalled();
    });
  });
});
