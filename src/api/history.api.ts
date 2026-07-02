import * as base from 'api/base.api';
import { IRRIGATION } from 'api/routes';

export interface HistoryParams {
  limit?: number;
  offset?: number;
  zoneId?: number;
  subzoneId?: number;
  startDate?: string;
  endDate?: string;
}

export const fetchHistory = async (params?: HistoryParams) => {
  return base.get(`${IRRIGATION}/history`, params as Record<string, unknown>);
};

export const fetchHistoryTotals = async (params?: { zoneId?: number; subzoneId?: number }) => {
  return base.get(`${IRRIGATION}/history/totals`, params as Record<string, unknown>);
};

export const deleteHistory = async (id: number) => {
  return base.del(`${IRRIGATION}/history/${id}`);
};
