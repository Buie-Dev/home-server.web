import { get, post, put, del } from 'api/base.api';
import { ROWING } from 'api/routes';

export type Gender = 'Men' | 'Women' | 'Mixed';
export type AgeCategory = 'U15' | 'U17' | 'U19' | 'U23' | 'Open';

export type BoatClass = {
  id: number;
  symbol: string;
  crewCount: number;
  hasCox: boolean;
};

export type CrewMember = {
  id: number;
  name: string;
  gender: string;
  createdAt: string;
};

export type Boat = {
  id: number;
  name: string;
  boatClassId: number | null;
  boatClassSymbol: string | null;
  boatClassCrewCount: number | null;
  boatClassHasCox: boolean;
  createdAt: string;
};

export type CrewSeat = {
  crewMemberId: number;
  name: string;
  gender: string;
};

export type Crew = {
  id: number;
  boatId: number;
  boatName: string;
  boatClassId: number | null;
  boatClassSymbol: string | null;
  boatClassCrewCount: number | null;
  boatClassHasCox: boolean;
  gender: Gender;
  ageCategory: AgeCategory;
  crewClassName: string | null;
  cox: CrewSeat | null;
  seat1: CrewSeat | null;
  seat2: CrewSeat | null;
  seat3: CrewSeat | null;
  seat4: CrewSeat | null;
  seat5: CrewSeat | null;
  seat6: CrewSeat | null;
  seat7: CrewSeat | null;
  seat8: CrewSeat | null;
  hasResults: boolean;
  createdAt: string;
};

export type CrewSeats = {
  cox: number | null;
  seat1: number | null;
  seat2: number | null;
  seat3: number | null;
  seat4: number | null;
  seat5: number | null;
  seat6: number | null;
  seat7: number | null;
  seat8: number | null;
};

export type RaceType = 'time_trial' | 'side_by_side';
export type RaceStatus = 'pending' | 'active' | 'completed';

export type RaceEntry = {
  id: number;
  raceId: number;
  crewId: number | null;
  boatName: string;
  coxName: string | null;
  strokeName: string | null;
  keyPerson: string | null;
  startTime: number | null;
  finishTime: number | null;
  elapsedMs: number | null;
  dns: boolean;
  dnf: boolean;
  placement: number | null;
  gender: string | null;
  ageCategory: string | null;
  boatClassSymbol: string | null;
  wbtPct: number | null;
  wbtIsEstimated: boolean;
};

export type Race = {
  id: number;
  distance: string;
  raceType: RaceType;
  eventType: string | null;
  windConditions: string | null;
  notes: string | null;
  status: RaceStatus;
  createdAt: string;
  completedAt: string | null;
  entries: RaceEntry[];
};

// ── Boat Classes ───────────────────────────────────────────────────────────────

export const fetchBoatClasses = (): Promise<BoatClass[]> => get(`${ROWING}/boat-classes`);

// ── Crew Members ──────────────────────────────────────────────────────────────

export const fetchCrewMembers = (): Promise<CrewMember[]> => get(`${ROWING}/crew`);

export const createCrewMember = ({ name, gender }: { name: string; gender: string }): Promise<{ id: number }> =>
  post(`${ROWING}/crew`, { name, gender });

export const updateCrewMember = ({
  id,
  name,
  gender,
}: {
  id: number;
  name: string;
  gender: string;
}): Promise<{ success: boolean }> => put(`${ROWING}/crew/${id}`, { name, gender });

export const deleteCrewMember = ({ id }: { id: number }): Promise<{ success: boolean }> => del(`${ROWING}/crew/${id}`);

// ── Boats ─────────────────────────────────────────────────────────────────────

export const fetchBoats = (): Promise<Boat[]> => get(`${ROWING}/boats`);

export const createBoat = ({ name, boatClassId }: { name: string; boatClassId?: number }): Promise<{ id: number }> =>
  post(`${ROWING}/boats`, { name, boatClassId });

export const updateBoat = ({
  id,
  name,
  boatClassId,
}: {
  id: number;
  name: string;
  boatClassId?: number;
}): Promise<{ success: boolean }> => put(`${ROWING}/boats/${id}`, { name, boatClassId });

export const deleteBoat = ({ id }: { id: number }): Promise<{ success: boolean }> => del(`${ROWING}/boats/${id}`);

// ── Crews ─────────────────────────────────────────────────────────────────────

export const fetchCrews = (): Promise<Crew[]> => get(`${ROWING}/crews`);

export const createCrew = ({
  boatId,
  gender,
  ageCategory,
  cox,
  seat1,
  seat2,
  seat3,
  seat4,
  seat5,
  seat6,
  seat7,
  seat8,
}: { boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats): Promise<{ id: number }> =>
  post(`${ROWING}/crews`, { boatId, gender, ageCategory, cox, seat1, seat2, seat3, seat4, seat5, seat6, seat7, seat8 });

export const updateCrew = ({
  id,
  boatId,
  gender,
  ageCategory,
  cox,
  seat1,
  seat2,
  seat3,
  seat4,
  seat5,
  seat6,
  seat7,
  seat8,
}: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats): Promise<{
  id: number;
  copied: boolean;
}> =>
  put(`${ROWING}/crews/${id}`, {
    boatId,
    gender,
    ageCategory,
    cox,
    seat1,
    seat2,
    seat3,
    seat4,
    seat5,
    seat6,
    seat7,
    seat8,
  });

export const deleteCrew = ({ id }: { id: number }): Promise<{ success: boolean }> => del(`${ROWING}/crews/${id}`);

export const updateCrewLineup = ({
  id,
  boatId,
  gender,
  ageCategory,
  cox,
  seat1,
  seat2,
  seat3,
  seat4,
  seat5,
  seat6,
  seat7,
  seat8,
}: { id: number; boatId: number; gender: Gender; ageCategory: AgeCategory } & CrewSeats): Promise<{
  success: boolean;
}> =>
  put(`${ROWING}/crews/${id}/lineup`, {
    boatId,
    gender,
    ageCategory,
    cox,
    seat1,
    seat2,
    seat3,
    seat4,
    seat5,
    seat6,
    seat7,
    seat8,
  });

// ── Races ─────────────────────────────────────────────────────────────────────

export const fetchRaces = ({ date }: { date?: string } = {}): Promise<Race[]> =>
  get(`${ROWING}/races`, date ? { date } : undefined);

export const fetchRace = ({ id }: { id: number }): Promise<Race> => get(`${ROWING}/races/${id}`);

export const createRace = ({
  distance,
  raceType,
  crewIds,
  eventType,
  windConditions,
  notes,
}: {
  distance: string;
  raceType: RaceType;
  crewIds: number[];
  eventType?: string;
  windConditions?: string;
  notes?: string;
}): Promise<{ id: number }> =>
  post(`${ROWING}/races`, { distance, raceType, crewIds, eventType, windConditions, notes });

export const activateRace = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/races/${id}/activate`);

export const completeRace = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/races/${id}/complete`);

export const deleteRace = ({ id }: { id: number }): Promise<{ success: boolean }> => del(`${ROWING}/races/${id}`);

// ── Race Entries ──────────────────────────────────────────────────────────────

export const recordEntryStart = ({
  entryId,
  startTime,
}: {
  entryId: number;
  startTime: number;
}): Promise<{ success: boolean }> => post(`${ROWING}/entries/${entryId}/start`, { startTime });

export const recordEntryFinish = ({
  entryId,
  finishTime,
  elapsedMs,
}: {
  entryId: number;
  finishTime: number;
  elapsedMs: number;
}): Promise<{ success: boolean }> => post(`${ROWING}/entries/${entryId}/finish`, { finishTime, elapsedMs });

export const markEntryDns = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/dns`);

export const markEntryDnf = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/dnf`);

export const updateEntryCrew = ({
  entryId,
  crewId,
}: {
  entryId: number;
  crewId: number;
}): Promise<{ success: boolean }> => put(`${ROWING}/entries/${entryId}/crew`, { crewId });

export const deleteEntry = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  del(`${ROWING}/entries/${entryId}`);
