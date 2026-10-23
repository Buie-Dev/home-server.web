vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import { fetchHistory, fetchHistoryTotals, deleteHistory } from 'api/history.api';

const mockedGet = vi.mocked(base.get);
const mockedDel = vi.mocked(base.del);

describe('history.api', () => {
  describe('fetchHistory', () => {
    it('calls get with history endpoint', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchHistory();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/history'), undefined);
    });

    it('passes query params', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchHistory({ limit: 50, offset: 10, zoneId: 1 });
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('/irrigations/history'),
        expect.objectContaining({ limit: 50, offset: 10, zoneId: 1 })
      );
    });
  });

  describe('fetchHistoryTotals', () => {
    it('calls get with totals endpoint', async () => {
      mockedGet.mockResolvedValue({ today: {}, week: {}, month: {} });
      await fetchHistoryTotals();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/irrigations/history/totals'), undefined);
    });

    it('passes zone filter', async () => {
      mockedGet.mockResolvedValue({});
      await fetchHistoryTotals({ zoneId: 2 });
      expect(mockedGet).toHaveBeenCalledWith(
        expect.stringContaining('/irrigations/history/totals'),
        expect.objectContaining({ zoneId: 2 })
      );
    });
  });

  describe('deleteHistory', () => {
    it('calls del with history/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteHistory(42);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/irrigations/history/42'));
    });
  });
});
