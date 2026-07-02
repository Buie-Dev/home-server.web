import { useRef, useState } from 'react';
import * as historyApi from 'api/history.api';

export type IrrigationRun = {
  id: number;
  zoneName: string;
  zoneType: string;
  subzoneName?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  totalLitres: number;
};

export type HistoryTotals = {
  today: { litres: number; minutes: number; runs: number };
  week: { litres: number; minutes: number; runs: number };
  month: { litres: number; minutes: number; runs: number };
};

export type HistoryFilters = {
  zoneId?: number;
  subzoneId?: number;
  startDate?: string;
  endDate?: string;
};

const PAGE_SIZE = 100;

interface HistoryInfo {
  history: IrrigationRun[];
  totals: HistoryTotals | null;
  fetchHistory: (filters?: HistoryFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  deleteHistory: (id: number) => Promise<void>;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}

function useHistory(): HistoryInfo {
  const [history, setHistory] = useState<IrrigationRun[]>([]);
  const [totals, setTotals] = useState<HistoryTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const filtersRef = useRef<HistoryFilters>({});

  const fetchHistory = async (filters: HistoryFilters = {}): Promise<void> => {
    filtersRef.current = filters;
    setLoading(true);
    setHasMore(false);
    try {
      const [data, totalsData] = await Promise.all([
        historyApi.fetchHistory({ limit: PAGE_SIZE, offset: 0, ...filters }),
        historyApi.fetchHistoryTotals({ zoneId: filters.zoneId, subzoneId: filters.subzoneId }),
      ]);
      const rows = Array.isArray(data) ? (data as IrrigationRun[]) : [];
      setHistory(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setTotals(totalsData as HistoryTotals);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (): Promise<void> => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await historyApi.fetchHistory({
        limit: PAGE_SIZE,
        offset: history.length,
        ...filtersRef.current,
      });
      const rows = Array.isArray(data) ? (data as IrrigationRun[]) : [];
      setHistory((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      // silently handle
    } finally {
      setLoadingMore(false);
    }
  };

  const deleteHistory = async (id: number): Promise<void> => {
    await historyApi.deleteHistory(id);
    setHistory((prev) => prev.filter((run) => run.id !== id));
    historyApi
      .fetchHistoryTotals({ zoneId: filtersRef.current.zoneId, subzoneId: filtersRef.current.subzoneId })
      .then((data) => setTotals(data as HistoryTotals))
      .catch(() => {});
  };

  return { history, totals, fetchHistory, loadMore, deleteHistory, loading, loadingMore, hasMore };
}

export default useHistory;
