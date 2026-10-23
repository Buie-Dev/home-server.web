vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import {
  fetchBoatClasses, fetchCrewMembers, createCrewMember, updateCrewMember, deleteCrewMember,
  fetchBoats, createBoat, updateBoat, deleteBoat,
  fetchCrews, createCrew, updateCrew, deleteCrew, updateCrewLineup,
  fetchRaces, fetchRace, createRace, activateRace, completeRace, deleteRace,
  recordEntryStart, recordEntryFinish, markEntryDns, markEntryDnf, updateEntryCrew, deleteEntry,
} from 'api/rowing.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('rowing.api', () => {
  describe('boat classes', () => {
    it('fetchBoatClasses calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchBoatClasses();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/boat-classes'));
    });
  });

  describe('crew members', () => {
    it('fetchCrewMembers calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchCrewMembers();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/crew'));
    });

    it('createCrewMember posts name and gender', async () => {
      mockedPost.mockResolvedValue({ id: 1 });
      await createCrewMember({ name: 'Alice', gender: 'Women' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/crew'), { name: 'Alice', gender: 'Women' });
    });

    it('updateCrewMember puts to crew/:id', async () => {
      mockedPut.mockResolvedValue({ success: true });
      await updateCrewMember({ id: 1, name: 'Bob', gender: 'Men' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/rowing/crew/1'), { name: 'Bob', gender: 'Men' });
    });

    it('deleteCrewMember deletes crew/:id', async () => {
      mockedDel.mockResolvedValue({ success: true });
      await deleteCrewMember({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/rowing/crew/1'));
    });
  });

  describe('boats', () => {
    it('fetchBoats calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchBoats();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/boats'));
    });

    it('createBoat posts name and boatClassId', async () => {
      mockedPost.mockResolvedValue({ id: 1 });
      await createBoat({ name: 'Shell A', boatClassId: 2 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/boats'), { name: 'Shell A', boatClassId: 2 });
    });

    it('updateBoat puts to boats/:id', async () => {
      mockedPut.mockResolvedValue({ success: true });
      await updateBoat({ id: 1, name: 'Shell B', boatClassId: 3 });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/rowing/boats/1'), { name: 'Shell B', boatClassId: 3 });
    });

    it('deleteBoat deletes boats/:id', async () => {
      mockedDel.mockResolvedValue({ success: true });
      await deleteBoat({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/rowing/boats/1'));
    });
  });

  describe('crews', () => {
    const seats = { cox: null, seat1: 1, seat2: 2, seat3: null, seat4: null, seat5: null, seat6: null, seat7: null, seat8: null };

    it('fetchCrews calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchCrews();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/crews'));
    });

    it('createCrew posts crew data', async () => {
      mockedPost.mockResolvedValue({ id: 1 });
      await createCrew({ boatId: 1, gender: 'Men', ageCategory: 'Open', ...seats });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/crews'), expect.objectContaining({ boatId: 1, gender: 'Men' }));
    });

    it('updateCrew puts to crews/:id', async () => {
      mockedPut.mockResolvedValue({ id: 1, copied: false });
      await updateCrew({ id: 1, boatId: 1, gender: 'Women', ageCategory: 'U23', ...seats });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/rowing/crews/1'), expect.objectContaining({ gender: 'Women' }));
    });

    it('deleteCrew deletes crews/:id', async () => {
      mockedDel.mockResolvedValue({ success: true });
      await deleteCrew({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/rowing/crews/1'));
    });

    it('updateCrewLineup puts to crews/:id/lineup', async () => {
      mockedPut.mockResolvedValue({ success: true });
      await updateCrewLineup({ id: 1, boatId: 1, gender: 'Men', ageCategory: 'Open', ...seats });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/rowing/crews/1/lineup'), expect.objectContaining({ boatId: 1 }));
    });
  });

  describe('races', () => {
    it('fetchRaces calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchRaces();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/races'), undefined);
    });

    it('fetchRaces passes date filter', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchRaces({ date: '2024-06-15' });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/races'), { date: '2024-06-15' });
    });

    it('fetchRace calls get with id', async () => {
      mockedGet.mockResolvedValue({ id: 1 });
      await fetchRace({ id: 1 });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/rowing/races/1'));
    });

    it('createRace posts race data', async () => {
      mockedPost.mockResolvedValue({ id: 1 });
      await createRace({ distance: '2000m', raceType: 'time_trial', crewIds: [1, 2] });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/races'), expect.objectContaining({ distance: '2000m', crewIds: [1, 2] }));
    });

    it('activateRace posts to races/:id/activate', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await activateRace({ id: 1 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/races/1/activate'));
    });

    it('completeRace posts to races/:id/complete', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await completeRace({ id: 1 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/races/1/complete'));
    });

    it('deleteRace deletes races/:id', async () => {
      mockedDel.mockResolvedValue({ success: true });
      await deleteRace({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/rowing/races/1'));
    });
  });

  describe('race entries', () => {
    it('recordEntryStart posts start time', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await recordEntryStart({ entryId: 10, startTime: 1700000000000 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/10/start'), { startTime: 1700000000000 });
    });

    it('recordEntryFinish posts finish time and elapsed', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await recordEntryFinish({ entryId: 10, finishTime: 1700000300000, elapsedMs: 300000 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/10/finish'), { finishTime: 1700000300000, elapsedMs: 300000 });
    });

    it('markEntryDns posts to dns', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await markEntryDns({ entryId: 5 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/5/dns'));
    });

    it('markEntryDnf posts to dnf', async () => {
      mockedPost.mockResolvedValue({ success: true });
      await markEntryDnf({ entryId: 5 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/5/dnf'));
    });

    it('updateEntryCrew puts crew id', async () => {
      mockedPut.mockResolvedValue({ success: true });
      await updateEntryCrew({ entryId: 10, crewId: 3 });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/10/crew'), { crewId: 3 });
    });

    it('deleteEntry deletes entry', async () => {
      mockedDel.mockResolvedValue({ success: true });
      await deleteEntry({ entryId: 10 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/rowing/entries/10'));
    });
  });
});
