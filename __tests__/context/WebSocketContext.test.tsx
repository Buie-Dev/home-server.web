import React from 'react';
import { renderHook, act } from '@testing-library/react';

vi.mock('lib/tokenStorage', () => ({
  getToken: vi.fn(),
}));

vi.mock('config/config', () => ({
  baseWebSocketUrl: 'ws://localhost:8765',
}));

import { getToken } from 'lib/tokenStorage';
import { WebSocketProvider, useWebSocket, WEBSOCKET_TOPICS } from 'context/WebSocketContext';

const mockedGetToken = vi.mocked(getToken);

// Track all created instances
let mockWsInstances: Array<{
  url: string;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onclose: ((event: CloseEvent) => void) | null;
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
}>;

beforeEach(() => {
  mockWsInstances = [];

  const MockWebSocket = vi.fn().mockImplementation((url: string) => {
    const instance = {
      url,
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1,
    };
    mockWsInstances.push(instance);
    return instance;
  });
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSED = 3;
  MockWebSocket.CONNECTING = 0;
  MockWebSocket.CLOSING = 2;

  vi.stubGlobal('WebSocket', MockWebSocket);
  mockedGetToken.mockReturnValue('test-token');
});

const latestWs = () => mockWsInstances[mockWsInstances.length - 1];

const wrapper = ({ children }: { children: React.ReactNode }) => <WebSocketProvider>{children}</WebSocketProvider>;

describe('WebSocketContext', () => {
  it('connects on mount with token', () => {
    renderHook(() => useWebSocket(), { wrapper });
    expect(latestWs().url).toBe('ws://localhost:8765?token=test-token');
  });

  it('connects without token when none exists', () => {
    mockedGetToken.mockReturnValue(null);
    renderHook(() => useWebSocket(), { wrapper });
    expect(latestWs().url).toBe('ws://localhost:8765');
  });

  it('sets isConnected to true on open', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('sets isConnected to false on close', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });
    act(() => {
      latestWs().onclose?.(new CloseEvent('close'));
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('sets isConnected to false on error', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onerror?.(new Event('error'));
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('parses current state messages', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            topic: WEBSOCKET_TOPICS.CURRENT_STATE,
            message: JSON.stringify([{ id: 1, state: true }]),
          }),
        })
      );
    });

    expect(result.current.latestCurrentStates).toEqual([{ id: 1, state: true }]);
  });

  it('parses priority queue messages', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            topic: WEBSOCKET_TOPICS.PRIORITY_QUEUE,
            message: JSON.stringify([{ id: 'abc', duration: 300, zone: 1, priority: 1 }]),
          }),
        })
      );
    });

    expect(result.current.latestCurrentQueueStates).toHaveLength(1);
    expect(result.current.latestCurrentQueueStates[0].id).toBe('abc');
  });

  it('parses health check response and deduplicates by deviceId', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            topic: WEBSOCKET_TOPICS.HEALTH_CHECK_RESPONSE,
            message: JSON.stringify({ deviceId: 'pi-1', status: 'pi-1' }),
          }),
        })
      );
    });

    expect(result.current.latestHealthCheckResponses).toHaveLength(1);

    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            topic: WEBSOCKET_TOPICS.HEALTH_CHECK_RESPONSE,
            message: JSON.stringify({ deviceId: 'pi-1', status: 'pi-1' }),
          }),
        })
      );
    });

    expect(result.current.latestHealthCheckResponses).toHaveLength(1);
  });

  it('parses live flow messages', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({
            topic: WEBSOCKET_TOPICS.LIVE_FLOW,
            message: JSON.stringify({ id: 'zone-1', litres: 12.5 }),
          }),
        })
      );
    });

    expect(result.current.liveFlow).toEqual({ id: 'zone-1', litres: 12.5 });
  });

  it('parses rowing start event', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    const event = { raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000000000 };
    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ topic: WEBSOCKET_TOPICS.ROWING_START, message: event }),
        })
      );
    });

    expect(result.current.latestRowingStartEvent).toEqual(event);
  });

  it('parses rowing finish event', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    const event = { raceId: 1, entryId: 10, boatName: 'Shell A', timestamp: 1700000300000, elapsedMs: 300000 };
    act(() => {
      latestWs().onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ topic: WEBSOCKET_TOPICS.ROWING_FINISH, message: event }),
        })
      );
    });

    expect(result.current.latestRowingFinishEvent).toEqual(event);
  });

  it('sendMessage sends JSON when connected', () => {
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      latestWs().onopen?.(new Event('open'));
    });

    act(() => {
      result.current.sendMessage('request', { zone: 1 });
    });

    expect(latestWs().send).toHaveBeenCalledWith(JSON.stringify({ topic: 'request', message: { zone: 1 } }));
  });

  it('sendMessage does not send when disconnected', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useWebSocket(), { wrapper });

    act(() => {
      result.current.sendMessage('request', { zone: 1 });
    });

    expect(latestWs().send).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('closes WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(), { wrapper });
    const ws = latestWs();
    unmount();
    expect(ws.close).toHaveBeenCalled();
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useWebSocket());
    }).toThrow('useWebSocket must be used within a WebSocketProvider');
  });
});
