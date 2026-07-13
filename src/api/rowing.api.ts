import { get, post, put, del } from 'api/base.api';
import { ROWING } from 'api/routes';

export type CrewMember = {
  id: number;
  name: string;
  createdAt: string;
};

export type BoatCrewSlot = {
  id: number;
  crewMemberId: number;
  crewMemberName: string;
  seatPosition: number;
};

export type Boat = {
  id: number;
  name: string;
  createdAt: string;
  crew: BoatCrewSlot[];
};

export type RaceType = 'time_trial' | 'side_by_side';
export type RaceStatus = 'pending' | 'active' | 'completed';

export type RaceEntry = {
  id: number;
  raceId: number;
  boatId: number;
  boatName: string;
  startTime: number | null;
  finishTime: number | null;
  elapsedMs: number | null;
  dns: boolean;
  dnf: boolean;
  placement: number | null;
};

export type Race = {
  id: number;
  distance: string;
  raceType: RaceType;
  windConditions: string | null;
  notes: string | null;
  status: RaceStatus;
  createdAt: string;
  completedAt: string | null;
  entries: RaceEntry[];
};

type CreateBoatParams = {
  name: string;
  crewMemberIds: number[];
};

type UpdateBoatParams = {
  name: string;
  crewMemberIds: number[];
};

type CreateRaceParams = {
  distance: string;
  raceType: RaceType;
  boatIds: number[];
  windConditions?: string;
  notes?: string;
};

// ── Crew Members ──────────────────────────────────────────────────────────────

export const fetchCrewMembers = (): Promise<CrewMember[]> => get(`${ROWING}/crew`);

export const createCrewMember = ({ name }: { name: string }): Promise<{ id: number }> =>
  post(`${ROWING}/crew`, { name });

export const updateCrewMember = ({ id, name }: { id: number; name: string }): Promise<{ success: boolean }> =>
  put(`${ROWING}/crew/${id}`, { name });

export const deleteCrewMember = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  del(`${ROWING}/crew/${id}`);

// ── Boats ─────────────────────────────────────────────────────────────────────

export const fetchBoats = (): Promise<Boat[]> => get(`${ROWING}/boats`);

export const createBoat = ({ name, crewMemberIds }: CreateBoatParams): Promise<{ id: number }> =>
  post(`${ROWING}/boats`, { name, crewMemberIds });

export const updateBoat = ({ id, name, crewMemberIds }: UpdateBoatParams & { id: number }): Promise<{ success: boolean }> =>
  put(`${ROWING}/boats/${id}`, { name, crewMemberIds });

export const deleteBoat = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  del(`${ROWING}/boats/${id}`);

// ── Races ─────────────────────────────────────────────────────────────────────

export const fetchRaces = (): Promise<Race[]> => get(`${ROWING}/races`);

export const fetchRace = ({ id }: { id: number }): Promise<Race> => get(`${ROWING}/races/${id}`);

export const createRace = ({ distance, raceType, boatIds, windConditions, notes }: CreateRaceParams): Promise<{ id: number }> =>
  post(`${ROWING}/races`, { distance, raceType, boatIds, windConditions, notes });

export const activateRace = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/races/${id}/activate`);

export const completeRace = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/races/${id}/complete`);

export const deleteRace = ({ id }: { id: number }): Promise<{ success: boolean }> =>
  del(`${ROWING}/races/${id}`);

// ── Race Entries ──────────────────────────────────────────────────────────────

export const recordEntryStart = ({ entryId, startTime }: { entryId: number; startTime: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/start`, { startTime });

export const recordEntryFinish = ({ entryId, finishTime, elapsedMs }: { entryId: number; finishTime: number; elapsedMs: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/finish`, { finishTime, elapsedMs });

export const markEntryDns = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/dns`);

export const markEntryDnf = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  post(`${ROWING}/entries/${entryId}/dnf`);

export const deleteEntry = ({ entryId }: { entryId: number }): Promise<{ success: boolean }> =>
  del(`${ROWING}/entries/${entryId}`);
