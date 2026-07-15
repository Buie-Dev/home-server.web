import { get, post, put, del } from 'api/base.api';
import { AUTH, ADMIN } from 'api/routes';

interface LoginResponse {
  token: string;
}

export const loginRequest = (username: string, password: string): Promise<LoginResponse> => {
  return post<LoginResponse>(`${AUTH}/login`, { username, password });
};

export const fetchMyPermissions = (): Promise<{ user_id: number; pages: string[] }> => {
  return get<{ user_id: number; pages: string[] }>(`${AUTH}/me/permissions`);
};

export const fetchAllUsers = (): Promise<{ id: number; username: string; permissions: Record<string, boolean> }[]> => {
  return get<{ id: number; username: string; permissions: Record<string, boolean> }[]>(`${ADMIN}/users`);
};

export const setUserPermissions = (userId: number, permissions: Record<string, boolean>): Promise<void> => {
  return put<void>(`${ADMIN}/users/${userId}/permissions`, permissions);
};

export const createUser = ({ username, password }: { username: string; password: string }): Promise<{ id: number; username: string }> => {
  return post<{ id: number; username: string }>(`${ADMIN}/users`, { username, password });
};

export const deleteUser = ({ userId }: { userId: number }): Promise<void> => {
  return del<void>(`${ADMIN}/users/${userId}`);
};
