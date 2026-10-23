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

vi.mock('api/rowing.api', () => ({
  fetchBoatClasses: vi.fn(),
  fetchCrewMembers: vi.fn(),
  createCrewMember: vi.fn(),
  updateCrewMember: vi.fn(),
  deleteCrewMember: vi.fn(),
  fetchBoats: vi.fn(),
  createBoat: vi.fn(),
  updateBoat: vi.fn(),
  deleteBoat: vi.fn(),
  fetchCrews: vi.fn(),
  createCrew: vi.fn(),
  updateCrew: vi.fn(),
  updateCrewLineup: vi.fn(),
  deleteCrew: vi.fn(),
  fetchRaces: vi.fn(),
  fetchRace: vi.fn(),
  createRace: vi.fn(),
  completeRace: vi.fn(),
  deleteRace: vi.fn(),
  recordEntryStart: vi.fn(),
  recordEntryFinish: vi.fn(),
  markEntryDns: vi.fn(),
  markEntryDnf: vi.fn(),
  updateEntryCrew: vi.fn(),
  deleteEntry: vi.fn(),
  activateRace: vi.fn(),
}));

import * as rowingApi from 'api/rowing.api';
import { useRowing } from 'hooks/useRowing.hook';

const mockedFetchBoatClasses = vi.mocked(rowingApi.fetchBoatClasses);
const mockedFetchCrewMembers = vi.mocked(rowingApi.fetchCrewMembers);
const mockedCreateCrewMember = vi.mocked(rowingApi.createCrewMember);
const mockedFetchBoats = vi.mocked(rowingApi.fetchBoats);
const mockedCreateBoat = vi.mocked(rowingApi.createBoat);
const mockedFetchCrews = vi.mocked(rowingApi.fetchCrews);
const mockedFetchRaces = vi.mocked(rowingApi.fetchRaces);
const mockedCreateRace = vi.mocked(rowingApi.createRace);
const mockedRecordEntryStart = vi.mocked(rowingApi.recordEntryStart);
const mockedRecordEntryFinish = vi.mocked(rowingApi.recordEntryFinish);
const mockedDeleteRace = vi.mocked(rowingApi.deleteRace);

beforeEach(() => {
  resetWebSocketMock();
});

describe('useRowing', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useRowing());
    expect(result.current.boatClasses).toEqual([]);
    expect(result.current.crewMembers).toEqual([]);
    expect(result.current.boats).toEqual([]);
    expect(result.current.crews).toEqual([]);
    expect(result.current.races).toEqual([]);
    expect(result.current.activeRace).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchAllBoatClasses loads boat classes', async () => {
    mockedFetchBoatClasses.mockResolvedValue([{ id: 1, symbol: '1x', crewCount: 1, hasCox: false }]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllBoatClasses();
    });

    expect(result.current.boatClasses).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetchAllBoatClasses sets error on failure', async () => {
    mockedFetchBoatClasses.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllBoatClasses();
    });

    expect(result.current.error).toBe('Failed to load boat classes');
  });

  it('fetchAllCrew loads crew members', async () => {
    mockedFetchCrewMembers.mockResolvedValue([{ id: 1, name: 'Alice', gender: 'Women', createdAt: '2024-01-01' }]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllCrew();
    });

    expect(result.current.crewMembers).toHaveLength(1);
  });

  it('addCrewMember creates and refetches', async () => {
    mockedCreateCrewMember.mockResolvedValue({ id: 2 });
    mockedFetchCrewMembers.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.addCrewMember({ name: 'Bob', gender: 'Men' });
    });

    expect(mockedCreateCrewMember).toHaveBeenCalledWith({ name: 'Bob', gender: 'Men' });
    expect(mockedFetchCrewMembers).toHaveBeenCalled();
  });

  it('fetchAllBoats loads boats', async () => {
    mockedFetchBoats.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllBoats();
    });

    expect(mockedFetchBoats).toHaveBeenCalled();
  });

  it('addBoat creates and refetches', async () => {
    mockedCreateBoat.mockResolvedValue({ id: 1 });
    mockedFetchBoats.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.addBoat({ name: 'Shell A' });
    });

    expect(mockedCreateBoat).toHaveBeenCalledWith({ name: 'Shell A' });
  });

  it('fetchAllCrews loads crews', async () => {
    mockedFetchCrews.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllCrews();
    });

    expect(mockedFetchCrews).toHaveBeenCalled();
  });

  it('fetchAllRaces loads races', async () => {
    mockedFetchRaces.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.fetchAllRaces();
    });

    expect(mockedFetchRaces).toHaveBeenCalled();
  });

  it('startRace creates race and returns id', async () => {
    mockedCreateRace.mockResolvedValue({ id: 42 });
    mockedFetchRaces.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    let raceId: number = 0;
    await act(async () => {
      raceId = await result.current.startRace({ distance: '2000m', raceType: 'time_trial', crewIds: [1, 2] });
    });

    expect(raceId).toBe(42);
  });

  it('sendBoatStart records start and sends WebSocket message', async () => {
    mockedRecordEntryStart.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.sendBoatStart({ raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000000000 });
    });

    expect(mockedRecordEntryStart).toHaveBeenCalledWith({ entryId: 10, startTime: 1700000000000 });
    expect(mockWebSocketValue.sendMessage).toHaveBeenCalledWith('rowing/start', { raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000000000 });
  });

  it('sendBoatFinish records finish and sends WebSocket message', async () => {
    mockedRecordEntryFinish.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.sendBoatFinish({ raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000300000, elapsedMs: 300000 });
    });

    expect(mockedRecordEntryFinish).toHaveBeenCalledWith({ entryId: 10, finishTime: 1700000300000, elapsedMs: 300000 });
    expect(mockWebSocketValue.sendMessage).toHaveBeenCalledWith('rowing/finish', { raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000300000, elapsedMs: 300000 });
  });

  it('removeRace deletes and refetches', async () => {
    mockedDeleteRace.mockResolvedValue({ success: true });
    mockedFetchRaces.mockResolvedValue([]);
    const { result } = renderHook(() => useRowing());

    await act(async () => {
      await result.current.removeRace({ id: 1 });
    });

    expect(mockedDeleteRace).toHaveBeenCalledWith({ id: 1 });
    expect(mockedFetchRaces).toHaveBeenCalled();
  });
});
