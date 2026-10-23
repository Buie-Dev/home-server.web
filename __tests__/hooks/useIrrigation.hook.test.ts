import { renderHook, act } from '@testing-library/react';
import { mockWebSocketValue, resetWebSocketMock } from '../helpers';

vi.mock('context/WebSocketContext', () => ({
  useWebSocket: () => mockWebSocketValue,
  WEBSOCKET_TOPICS: {
    CURRENT_STATE: 'current',
    PRIORITY_QUEUE: 'priorityQueue',
    HEALTH_CHECK_RESPONSE: 'healthcheck/response',
    LIVE_FLOW: 'liveFlow',
    ROWING_START: 'rowing/start',
    ROWING_FINISH: 'rowing/finish',
  },
}));

vi.mock('api/irrigation.api', () => ({
  fetchZones: vi.fn(),
  fetchZoneTypes: vi.fn(),
  fetchSchedules: vi.fn(),
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  toggleSchedule: vi.fn(),
  reorderSchedules: vi.fn(),
  checkScheduleSync: vi.fn(),
  forceScheduleSync: vi.fn(),
  healthCheck: vi.fn(),
}));

import * as irrigationApi from 'api/irrigation.api';
import useIrrigation from 'hooks/useIrrigation.hook';

const mockedFetchZones = vi.mocked(irrigationApi.fetchZones);
const mockedFetchZoneTypes = vi.mocked(irrigationApi.fetchZoneTypes);
const mockedFetchSchedules = vi.mocked(irrigationApi.fetchSchedules);
const mockedCreateSchedule = vi.mocked(irrigationApi.createSchedule);
const mockedUpdateSchedule = vi.mocked(irrigationApi.updateSchedule);
const mockedDeleteSchedule = vi.mocked(irrigationApi.deleteSchedule);
const mockedToggleSchedule = vi.mocked(irrigationApi.toggleSchedule);
const mockedHealthCheck = vi.mocked(irrigationApi.healthCheck);
const mockedCheckSync = vi.mocked(irrigationApi.checkScheduleSync);
const mockedForceSync = vi.mocked(irrigationApi.forceScheduleSync);

beforeEach(() => {
  resetWebSocketMock();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockedFetchZones.mockResolvedValue([]);
  mockedHealthCheck.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIrrigation', () => {
  it('fetches zones on mount', async () => {
    renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);
    expect(mockedFetchZones).toHaveBeenCalled();
  });

  it('runs health check on mount', async () => {
    renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);
    expect(mockedHealthCheck).toHaveBeenCalled();
  });

  it('runs health check every 60 seconds', async () => {
    renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);
    expect(mockedHealthCheck).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60000);
    expect(mockedHealthCheck).toHaveBeenCalledTimes(2);
  });

  it('sets connected to true when health check succeeds', async () => {
    mockedHealthCheck.mockResolvedValue(undefined);
    const { result } = renderHook(() => useIrrigation());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.connected).toBe(true);
  });

  it('sets connected to false when health check fails', async () => {
    mockedHealthCheck.mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    expect(result.current.connected).toBe(false);
  });

  it('fetchSchedules calls API and updates state', async () => {
    const schedules = [{ id: 1, name: 'Morning', startTime: '06:00', duration: 10, monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false, subzoneIds: [], zoneName: 'Zone 1', zoneId: 1, active: true, sortOrder: 0 }];
    mockedFetchSchedules.mockResolvedValue(schedules);

    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    await act(async () => {
      await result.current.fetchSchedules();
    });

    expect(result.current.schedules).toEqual(schedules);
  });

  it('createSchedule calls API', async () => {
    mockedCreateSchedule.mockResolvedValue(undefined);
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    const data = { name: 'Test', startTime: '07:00', duration: 5, monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false, zoneId: 1 };
    await act(async () => {
      await result.current.createSchedule(data);
    });

    expect(mockedCreateSchedule).toHaveBeenCalledWith(data);
  });

  it('updateSchedule calls API', async () => {
    mockedUpdateSchedule.mockResolvedValue(undefined);
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    const data = { name: 'Updated', startTime: '08:00', duration: 10, monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false, zoneId: 2 };
    await act(async () => {
      await result.current.updateSchedule(1, data);
    });

    expect(mockedUpdateSchedule).toHaveBeenCalledWith(1, data);
  });

  it('deleteSchedule calls API', async () => {
    mockedDeleteSchedule.mockResolvedValue(undefined);
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    await act(async () => {
      await result.current.deleteSchedule(5);
    });

    expect(mockedDeleteSchedule).toHaveBeenCalledWith(5);
  });

  it('toggleSchedule calls API and refetches schedules', async () => {
    mockedToggleSchedule.mockResolvedValue(undefined);
    mockedFetchSchedules.mockResolvedValue([]);
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    await act(async () => {
      await result.current.toggleSchedule(1, false);
    });

    expect(mockedToggleSchedule).toHaveBeenCalledWith(1, false);
    expect(mockedFetchSchedules).toHaveBeenCalled();
  });

  it('stopAll sends WebSocket message', async () => {
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      result.current.stopAll();
    });

    expect(mockWebSocketValue.sendMessage).toHaveBeenCalledWith('stopAll', {});
  });

  it('stopQueueItem sends WebSocket message with id', async () => {
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      result.current.stopQueueItem('abc-123');
    });

    expect(mockWebSocketValue.sendMessage).toHaveBeenCalledWith('stop', { id: 'abc-123' });
  });

  it('fetchZoneTypes calls API and updates state', async () => {
    mockedFetchZoneTypes.mockResolvedValue([{ id: 1, type: 'garden' }]);
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    await act(async () => {
      await result.current.fetchZoneTypes();
    });

    expect(result.current.zoneTypes).toEqual([{ id: 1, type: 'garden' }]);
  });

  it('checkSync returns sync status', async () => {
    mockedCheckSync.mockResolvedValue({ in_sync: true, missing_from_automation: [], mismatched: [], extra_in_automation: [] });
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    let syncResult: unknown;
    await act(async () => {
      syncResult = await result.current.checkSync();
    });

    expect(syncResult).toEqual(expect.objectContaining({ in_sync: true }));
  });

  it('forceSync returns synced count', async () => {
    mockedForceSync.mockResolvedValue({ synced: 3 });
    const { result } = renderHook(() => useIrrigation());
    await vi.advanceTimersByTimeAsync(0);

    let syncResult: unknown;
    await act(async () => {
      syncResult = await result.current.forceSync();
    });

    expect(syncResult).toEqual({ synced: 3 });
  });
});
