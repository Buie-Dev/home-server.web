import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('api/auth.api', () => ({
  loginRequest: vi.fn(),
  fetchMyPermissions: vi.fn(),
}));

vi.mock('api/base.api', () => ({
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock('lib/tokenStorage', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { loginRequest, fetchMyPermissions } from 'api/auth.api';
import { setUnauthorizedHandler } from 'api/base.api';
import { getToken, setToken, clearToken } from 'lib/tokenStorage';
import { AuthProvider, useAuth } from 'context/AuthContext';

const mockedLoginRequest = vi.mocked(loginRequest);
const mockedFetchMyPermissions = vi.mocked(fetchMyPermissions);
const mockedSetUnauthorizedHandler = vi.mocked(setUnauthorizedHandler);
const mockedGetToken = vi.mocked(getToken);
const mockedSetToken = vi.mocked(setToken);
const mockedClearToken = vi.mocked(clearToken);

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  it('registers unauthorized handler on mount', async () => {
    mockedGetToken.mockReturnValue(null);
    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockedSetUnauthorizedHandler).toHaveBeenCalled();
    });
  });

  it('sets isLoading false when no token exists', async () => {
    mockedGetToken.mockReturnValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restores token on mount and loads permissions', async () => {
    mockedGetToken.mockReturnValue('existing-token');
    mockedFetchMyPermissions.mockResolvedValue({ user_id: 1, pages: ['irrigation', 'devices'] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe(1);
    expect(result.current.permissions).toEqual(['irrigation', 'devices']);
  });

  it('login stores token and loads permissions', async () => {
    mockedGetToken.mockReturnValue(null);
    mockedLoginRequest.mockResolvedValue({ token: 'new-jwt' });
    mockedFetchMyPermissions.mockResolvedValue({ user_id: 2, pages: ['rowing'] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = false;
    await act(async () => {
      success = await result.current.login('admin', 'pass');
    });

    expect(success).toBe(true);
    expect(mockedSetToken).toHaveBeenCalledWith('new-jwt');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.permissions).toEqual(['rowing']);
  });

  it('login returns false on failure', async () => {
    mockedGetToken.mockReturnValue(null);
    mockedLoginRequest.mockRejectedValue(new Error('bad credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let success: boolean = true;
    await act(async () => {
      success = await result.current.login('bad', 'creds');
    });

    expect(success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logout clears token and resets state', async () => {
    mockedGetToken.mockReturnValue('token');
    mockedFetchMyPermissions.mockResolvedValue({ user_id: 1, pages: ['irrigation'] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(mockedClearToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.permissions).toEqual([]);
  });

  it('hasPermission returns true when page is in permissions', async () => {
    mockedGetToken.mockReturnValue('token');
    mockedFetchMyPermissions.mockResolvedValue({ user_id: 1, pages: ['irrigation', 'rowing'] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('irrigation')).toBe(true);
    expect(result.current.hasPermission('admin')).toBe(false);
  });

  it('unauthorized handler clears auth state', async () => {
    mockedGetToken.mockReturnValue('token');
    mockedFetchMyPermissions.mockResolvedValue({ user_id: 1, pages: [] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Get the handler that was registered
    const handler = mockedSetUnauthorizedHandler.mock.calls[0][0];

    act(() => {
      handler();
    });

    expect(mockedClearToken).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
