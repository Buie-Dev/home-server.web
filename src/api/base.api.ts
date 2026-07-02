import axios, { AxiosError } from 'axios';
import { getToken } from 'lib/tokenStorage';

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void): void => {
  onUnauthorized = handler;
};

axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

export const get = async <T>(route: string, params?: Record<string, unknown>): Promise<T> => {
  const response = await axios.get<T>(route, { params, headers });
  return response.data;
};

export const post = async <T>(route: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axios.post<T>(route, data, { headers });
  return response.data;
};

export const put = async <T>(route: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axios.put<T>(route, data, { headers });
  return response.data;
};

export const del = async <T>(route: string, data?: Record<string, unknown>): Promise<T> => {
  const response = await axios.delete<T>(route, { data, headers });
  return response.data;
};
