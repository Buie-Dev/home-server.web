import { renderHook, act, waitFor } from '@testing-library/react';
import { mockWebSocketValue, resetWebSocketMock } from '../helpers';

vi.mock('context/WebSocketContext', () => ({
  useWebSocket: () => mockWebSocketValue,
}));

vi.mock('api/devices.api', () => ({
  fetchDeviceStatus: vi.fn(),
}));

import * as devicesApi from 'api/devices.api';
import useDevices from 'hooks/useDevices.hook';

const mockedFetchDeviceStatus = vi.mocked(devicesApi.fetchDeviceStatus);

beforeEach(() => {
  resetWebSocketMock();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const makeDevice = (id: string) => ({
  id,
  name: `device-${id}`,
  description: `Device ${id}`,
  type: 'raspberry_pi',
  healthCheckResponse: `device-${id}`,
});

describe('useDevices', () => {
  it('starts with empty devices and loading false', () => {
    const { result } = renderHook(() => useDevices());
    expect(result.current.devices).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchDevices loads devices with checking status', async () => {
    mockedFetchDeviceStatus.mockResolvedValue([makeDevice('1'), makeDevice('2')]);

    const { result } = renderHook(() => useDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.devices).toHaveLength(2);
    expect(result.current.devices[0].status).toBe('checking');
    expect(result.current.loading).toBe(false);
  });

  it('checkConnectivity sends healthcheck/request via WebSocket', async () => {
    mockedFetchDeviceStatus.mockResolvedValue([makeDevice('1')]);

    const { result } = renderHook(() => useDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    act(() => {
      result.current.checkConnectivity();
    });

    expect(mockWebSocketValue.sendMessage).toHaveBeenCalledWith('healthcheck/request', {});
  });

  it('checkConnectivity does nothing when not connected', async () => {
    mockWebSocketValue.isConnected = false;
    mockedFetchDeviceStatus.mockResolvedValue([makeDevice('1')]);

    const { result } = renderHook(() => useDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    act(() => {
      result.current.checkConnectivity();
    });

    expect(mockWebSocketValue.sendMessage).not.toHaveBeenCalled();
  });

  it('checkConnectivity does nothing when no devices', () => {
    const { result } = renderHook(() => useDevices());

    act(() => {
      result.current.checkConnectivity();
    });

    expect(mockWebSocketValue.sendMessage).not.toHaveBeenCalled();
  });

  it('marks devices offline after 5s timeout', async () => {
    mockedFetchDeviceStatus.mockResolvedValue([makeDevice('1')]);

    const { result } = renderHook(() => useDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    act(() => {
      result.current.checkConnectivity();
    });

    expect(result.current.devices[0].status).toBe('checking');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.devices[0].status).toBe('offline');
  });

  it('fetchDevices handles API errors', async () => {
    mockedFetchDeviceStatus.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useDevices());

    await act(async () => {
      await result.current.fetchDevices();
    });

    expect(result.current.devices).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
