import { renderHook, act, waitFor } from '@testing-library/react';
import useHistory from 'hooks/useHistory.hook';

vi.mock('api/history.api', () => ({
  fetchHistory: vi.fn(),
  fetchHistoryTotals: vi.fn(),
  deleteHistory: vi.fn(),
}));

import * as historyApi from 'api/history.api';

const mockedFetchHistory = vi.mocked(historyApi.fetchHistory);
const mockedFetchHistoryTotals = vi.mocked(historyApi.fetchHistoryTotals);
const mockedDeleteHistory = vi.mocked(historyApi.deleteHistory);

const makeRun = (id: number) => ({
  id,
  zoneName: `Zone ${id}`,
  zoneType: 'garden',
  startedAt: '2024-01-01',
  endedAt: '2024-01-01',
  durationSeconds: 300,
  totalLitres: 50,
});

const makeTotals = () => ({
  today: { litres: 100, minutes: 10, runs: 2 },
  week: { litres: 500, minutes: 50, runs: 10 },
  month: { litres: 2000, minutes: 200, runs: 40 },
});

describe('useHistory', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.totals).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });

  it('fetchHistory loads data and totals', async () => {
    const rows = [makeRun(1), makeRun(2)];
    mockedFetchHistory.mockResolvedValue(rows);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.totals).not.toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets hasMore to true when results equal PAGE_SIZE', async () => {
    const rows = Array.from({ length: 100 }, (_, i) => makeRun(i));
    mockedFetchHistory.mockResolvedValue(rows);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.hasMore).toBe(true);
  });

  it('sets hasMore to false when results less than PAGE_SIZE', async () => {
    mockedFetchHistory.mockResolvedValue([makeRun(1)]);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore appends results', async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => makeRun(i));
    const secondPage = [makeRun(100), makeRun(101)];
    mockedFetchHistory.mockResolvedValueOnce(firstPage);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    mockedFetchHistory.mockResolvedValueOnce(secondPage);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.history).toHaveLength(102);
  });

  it('loadMore uses correct offset', async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => makeRun(i));
    mockedFetchHistory.mockResolvedValueOnce(firstPage);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    mockedFetchHistory.mockResolvedValueOnce([]);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockedFetchHistory).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 100 }));
  });

  it('loadMore does nothing when hasMore is false', async () => {
    mockedFetchHistory.mockResolvedValue([makeRun(1)]);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    const callCount = mockedFetchHistory.mock.calls.length;

    await act(async () => {
      await result.current.loadMore();
    });

    expect(mockedFetchHistory.mock.calls.length).toBe(callCount);
  });

  it('deleteHistory removes item locally and refetches totals', async () => {
    mockedFetchHistory.mockResolvedValue([makeRun(1), makeRun(2)]);
    mockedFetchHistoryTotals.mockResolvedValue(makeTotals());
    mockedDeleteHistory.mockResolvedValue(undefined);

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    const totalsCallCount = mockedFetchHistoryTotals.mock.calls.length;

    await act(async () => {
      await result.current.deleteHistory(1);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].id).toBe(2);
    await waitFor(() => {
      expect(mockedFetchHistoryTotals.mock.calls.length).toBeGreaterThan(totalsCallCount);
    });
  });

  it('fetchHistory handles errors gracefully', async () => {
    mockedFetchHistory.mockRejectedValue(new Error('Network'));
    mockedFetchHistoryTotals.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
