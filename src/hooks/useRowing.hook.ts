import { useCallback, useState } from 'react';
import {
  fetchBoatClasses,
  fetchCrewMembers,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  fetchBoats,
  createBoat,
  updateBoat,
  deleteBoat,
  fetchCrews,
  createCrew,
  updateCrew,
  updateCrewLineup,
  deleteCrew,
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
  updateEntryCrew,
  deleteEntry,
} from 'api/rowing.api';
import type { BoatClass, Boat, Crew, CrewMember, CrewSeats, Race, RaceType, Gender, AgeCategory } from 'api/rowing.api';
import { useWebSocket, WEBSOCKET_TOPICS } from 'context/WebSocketContext';

type UseRowingReturn = {
  boatClasses: BoatClass[];
  crewMembers: CrewMember[];
  boats: Boat[];
  crews: Crew[];
  races: Race[];
  activeRace: Race | null;
  isLoading: boolean;
  error: string | null;
  fetchAllBoatClasses: () => Promise<void>;
  fetchAllCrew: () => Promise<void>;
  addCrewMember: ({ name, gender }: { name: string; gender: string }) => Promise<void>;
  editCrewMember: ({ id, name, gender }: { id: number; name: string; gender: string }) => Promise<void>;
  removeCrewMember: ({ id }: { id: number }) => Promise<void>;
  fetchAllBoats: () => Promise<void>;
  addBoat: ({ name, boatClassId }: { name: string; boatClassId?: number }) => Promise<void>;
  editBoat: ({ id, name, boatClassId }: { id: number; name: string; boatClassId?: number }) => Promise<void>;
  removeBoat: ({ id }: { id: number }) => Promise<void>;
  fetchAllCrews: () => Promise<void>;
  addCrew: ({ boatId, gender, ageCategory, ...seats }: { boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => Promise<void>;
  editCrew: ({ id, boatId, gender, ageCategory, ...seats }: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => Promise<{ copied: boolean }>;
  editCrewLineup: ({ id, boatId, gender, ageCategory, ...seats }: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => Promise<void>;
  removeCrew: ({ id }: { id: number }) => Promise<void>;
  fetchAllRaces: () => Promise<void>;
  loadRace: ({ id }: { id: number }) => Promise<void>;
  startRace: ({ distance, raceType, crewIds, eventType, windConditions, notes }: { distance: string; raceType: RaceType; crewIds: number[]; eventType?: string; windConditions?: string; notes?: string }) => Promise<number>;
  openRace: ({ id }: { id: number }) => Promise<void>;
  finishRace: ({ id }: { id: number }) => Promise<void>;
  removeRace: ({ id }: { id: number }) => Promise<void>;
  sendBoatStart: ({ raceId, entryId, boatName, timestamp }: { raceId: number; entryId: number; boatName: string; timestamp: number }) => Promise<void>;
  sendBoatFinish: ({ raceId, entryId, boatName, timestamp, elapsedMs }: { raceId: number; entryId: number; boatName: string; timestamp: number; elapsedMs: number }) => Promise<void>;
  setEntryDns: ({ entryId }: { entryId: number }) => Promise<void>;
  setEntryDnf: ({ entryId }: { entryId: number }) => Promise<void>;
  reassignEntryCrew: ({ entryId, crewId }: { entryId: number; crewId: number }) => Promise<void>;
  removeEntry: ({ entryId }: { entryId: number }) => Promise<void>;
};

export function useRowing(): UseRowingReturn {
  const { sendMessage } = useWebSocket();
  const [boatClasses, setBoatClasses] = useState<BoatClass[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [activeRace, setActiveRace] = useState<Race | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBoatClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBoatClasses(await fetchBoatClasses());
    } catch {
      setError('Failed to load boat classes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllCrew = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCrewMembers(await fetchCrewMembers());
    } catch {
      setError('Failed to load crew members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCrewMember = useCallback(async ({ name, gender }: { name: string; gender: string }) => {
    await createCrewMember({ name, gender });
    await fetchAllCrew();
  }, [fetchAllCrew]);

  const editCrewMember = useCallback(async ({ id, name, gender }: { id: number; name: string; gender: string }) => {
    await updateCrewMember({ id, name, gender });
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
      setBoats(await fetchBoats());
    } catch {
      setError('Failed to load boats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBoat = useCallback(async ({ name, boatClassId }: { name: string; boatClassId?: number }) => {
    await createBoat({ name, boatClassId });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const editBoat = useCallback(async ({ id, name, boatClassId }: { id: number; name: string; boatClassId?: number }) => {
    await updateBoat({ id, name, boatClassId });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const removeBoat = useCallback(async ({ id }: { id: number }) => {
    await deleteBoat({ id });
    await fetchAllBoats();
  }, [fetchAllBoats]);

  const fetchAllCrews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCrews(await fetchCrews());
    } catch {
      setError('Failed to load crews');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCrew = useCallback(async ({ boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 }: { boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => {
    await createCrew({ boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 });
    await fetchAllCrews();
  }, [fetchAllCrews]);

  const editCrew = useCallback(async ({ id, boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 }: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => {
    const result = await updateCrew({ id, boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 });
    await fetchAllCrews();
    return { copied: result.copied };
  }, [fetchAllCrews]);

  const removeCrew = useCallback(async ({ id }: { id: number }) => {
    await deleteCrew({ id });
    await fetchAllCrews();
  }, [fetchAllCrews]);

  const fetchAllRaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRaces(await fetchRaces());
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
      setActiveRace(await fetchRace({ id }));
    } catch {
      setError('Failed to load race');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const editCrewLineup = useCallback(async ({ id, boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 }: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats) => {
    await updateCrewLineup({ id, boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 });
    await fetchAllCrews();
    if (activeRace) {
      await loadRace({ id: activeRace.id });
    }
  }, [fetchAllCrews, activeRace, loadRace]);

  const startRace = useCallback(async ({ distance, raceType, crewIds, eventType, windConditions, notes }: { distance: string; raceType: RaceType; crewIds: number[]; eventType?: string; windConditions?: string; notes?: string }) => {
    const { id } = await createRace({ distance, raceType, crewIds, eventType, windConditions, notes });
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

  const reassignEntryCrew = useCallback(async ({ entryId, crewId }: { entryId: number; crewId: number }) => {
    await updateEntryCrew({ entryId, crewId });
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
    boatClasses,
    crewMembers,
    boats,
    crews,
    races,
    activeRace,
    isLoading,
    error,
    fetchAllBoatClasses,
    fetchAllCrew,
    addCrewMember,
    editCrewMember,
    removeCrewMember,
    fetchAllBoats,
    addBoat,
    editBoat,
    removeBoat,
    fetchAllCrews,
    addCrew,
    editCrew,
    editCrewLineup,
    removeCrew,
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
    reassignEntryCrew,
    removeEntry,
  };
}
