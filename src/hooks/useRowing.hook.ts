import { useCallback, useState } from 'react';
import {
  fetchCrewMembers,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  fetchBoats,
  createBoat,
  updateBoat,
  deleteBoat,
  fetchRaces,
  fetchRace,
  createRace,
  activateRace,
  completeRace,
  deleteRace,
  recordEntryStart,
  recordEntryFinish,
  markEntryDns,
  markEntryDnf,
  deleteEntry,
} from 'api/rowing.api';
import type { CrewMember, Boat, Race, RaceType } from 'api/rowing.api';
import { useWebSocket, WEBSOCKET_TOPICS } from 'context/WebSocketContext';

type UseRowingReturn = {
  crewMembers: CrewMember[];
  boats: Boat[];
  races: Race[];
  activeRace: Race | null;
  isLoading: boolean;
  error: string | null;
  fetchAllCrew: () => Promise<void>;
  addCrewMember: ({ name }: { name: string }) => Promise<void>;
  editCrewMember: ({ id, name }: { id: number; name: string }) => Promise<void>;
  removeCrewMember: ({ id }: { id: number }) => Promise<void>;
  fetchAllBoats: () => Promise<void>;
  addBoat: ({ name, crewMemberIds }: { name: string; crewMemberIds: number[] }) => Promise<void>;
  editBoat: ({ id, name, crewMemberIds }: { id: number; name: string; crewMemberIds: number[] }) => Promise<void>;
  removeBoat: ({ id }: { id: number }) => Promise<void>;
  fetchAllRaces: () => Promise<void>;
  loadRace: ({ id }: { id: number }) => Promise<void>;
  startRace: ({ distance, raceType, boatIds, windConditions, notes }: { distance: string; raceType: RaceType; boatIds: number[]; windConditions?: string; notes?: string }) => Promise<number>;
  openRace: ({ id }: { id: number }) => Promise<void>;
  finishRace: ({ id }: { id: number }) => Promise<void>;
  removeRace: ({ id }: { id: number }) => Promise<void>;
  sendBoatStart: ({ raceId, entryId, boatName, timestamp }: { raceId: number; entryId: number; boatName: string; timestamp: number }) => Promise<void>;
  sendBoatFinish: ({ raceId, entryId, boatName, timestamp, elapsedMs }: { raceId: number; entryId: number; boatName: string; timestamp: number; elapsedMs: number }) => Promise<void>;
  setEntryDns: ({ entryId }: { entryId: number }) => Promise<void>;
  setEntryDnf: ({ entryId }: { entryId: number }) => Promise<void>;
  removeEntry: ({ entryId }: { entryId: number }) => Promise<void>;
};

export function useRowing(): UseRowingReturn {
  const { sendMessage } = useWebSocket();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [activeRace, setActiveRace] = useState<Race | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCrew = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCrewMembers();
      setCrewMembers(data);
    } catch {
      setError('Failed to load crew members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCrewMember = useCallback(async ({ name }: { name: string }) => {
    await createCrewMember({ name });
    await fetchAllCrew();
  }, [fetchAllCrew]);

  const editCrewMember = useCallback(async ({ id, name }: { id: number; name: string }) => {
    await updateCrewMember({ id, name });
    await fetchAllCrew();
  }, [fetchAllCrew]);

  const removeCrewMember = useCallback(async ({ id }: { id: number }) => {
    await deleteCrewMember({ id });
    await fetchAllCrew();
  }, [fetchAllCrew]);

  const fetchAllBoats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchBoats();
      setBoats(data);
    } catch {
      setError('Failed to load boats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBoat = useCallback(async ({ name, crewMemberIds }: { name: string; crewMemberIds: number[] }) => {
    await createBoat({ name, crewMemberIds });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const editBoat = useCallback(async ({ id, name, crewMemberIds }: { id: number; name: string; crewMemberIds: number[] }) => {
    await updateBoat({ id, name, crewMemberIds });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const removeBoat = useCallback(async ({ id }: { id: number }) => {
    await deleteBoat({ id });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const fetchAllRaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRaces();
      setRaces(data);
    } catch {
      setError('Failed to load races');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRace = useCallback(async ({ id }: { id: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRace({ id });
      setActiveRace(data);
    } catch {
      setError('Failed to load race');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startRace = useCallback(async ({ distance, raceType, boatIds, windConditions, notes }: { distance: string; raceType: RaceType; boatIds: number[]; windConditions?: string; notes?: string }) => {
    const { id } = await createRace({ distance, raceType, boatIds, windConditions, notes });
    await fetchAllRaces();
    return id;
  }, [fetchAllRaces]);

  const openRace = useCallback(async ({ id }: { id: number }) => {
    await activateRace({ id });
    await loadRace({ id });
  }, [loadRace]);

  const finishRace = useCallback(async ({ id }: { id: number }) => {
    await completeRace({ id });
    await loadRace({ id });
    await fetchAllRaces();
  }, [loadRace, fetchAllRaces]);

  const removeRace = useCallback(async ({ id }: { id: number }) => {
    await deleteRace({ id });
    await fetchAllRaces();
  }, [fetchAllRaces]);

  const sendBoatStart = useCallback(async ({ raceId, entryId, boatName, timestamp }: { raceId: number; entryId: number; boatName: string; timestamp: number }) => {
    await recordEntryStart({ entryId, startTime: timestamp });
    sendMessage(WEBSOCKET_TOPICS.ROWING_START, { raceId, entryId, boatName, timestamp });
    if (activeRace) {
      await loadRace({ id: raceId });
    }
  }, [sendMessage, activeRace, loadRace]);

  const sendBoatFinish = useCallback(async ({ raceId, entryId, boatName, timestamp, elapsedMs }: { raceId: number; entryId: number; boatName: string; timestamp: number; elapsedMs: number }) => {
    await recordEntryFinish({ entryId, finishTime: timestamp, elapsedMs });
    sendMessage(WEBSOCKET_TOPICS.ROWING_FINISH, { raceId, entryId, boatName, timestamp, elapsedMs });
    if (activeRace) {
      await loadRace({ id: raceId });
    }
  }, [sendMessage, activeRace, loadRace]);

  const setEntryDns = useCallback(async ({ entryId }: { entryId: number }) => {
    await markEntryDns({ entryId });
    if (activeRace) {
      await loadRace({ id: activeRace.id });
    }
  }, [activeRace, loadRace]);

  const setEntryDnf = useCallback(async ({ entryId }: { entryId: number }) => {
    await markEntryDnf({ entryId });
    if (activeRace) {
      await loadRace({ id: activeRace.id });
    }
  }, [activeRace, loadRace]);

  const removeEntry = useCallback(async ({ entryId }: { entryId: number }) => {
    await deleteEntry({ entryId });
    if (activeRace) {
      await loadRace({ id: activeRace.id });
    }
  }, [activeRace, loadRace]);

  return {
    crewMembers,
    boats,
    races,
    activeRace,
    isLoading,
    error,
    fetchAllCrew,
    addCrewMember,
    editCrewMember,
    removeCrewMember,
    fetchAllBoats,
    addBoat,
    editBoat,
    removeBoat,
    fetchAllRaces,
    loadRace,
    startRace,
    openRace,
    finishRace,
    removeRace,
    sendBoatStart,
    sendBoatFinish,
    setEntryDns,
    setEntryDnf,
    removeEntry,
  };
}
