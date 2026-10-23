import React, { createContext, ReactElement, useContext, useEffect, useRef, useState } from 'react';
import { baseWebSocketUrl } from 'config/config';
import { getToken } from 'lib/tokenStorage';

export enum WEBSOCKET_TOPICS {
  CURRENT_STATE = 'current',
  PRIORITY_QUEUE = 'priorityQueue',
  HEALTH_CHECK_RESPONSE = 'healthcheck/response',
  LIVE_FLOW = 'liveFlow',
  ROWING_START = 'rowing/start',
  ROWING_FINISH = 'rowing/finish',
}

export type CurrentState = {
  id: number;
  state: boolean;
  subzones?: Array<{ id: number; state: boolean }>;
};

export type CurrentQueueState = {
  id: string;
  duration: number;
  zone: number;
  priority: number;
  start_time?: string;
  subzones?: Array<{ id: number; state: boolean }>;
};

export type HealthCheckResponse = {
  deviceId: string;
  status: string;
  timestamp?: number;
};

export type LiveFlowState = {
  id: string;
  litres: number;
};

export type RowingStartEvent = {
  raceId: number;
  entryId: number;
  boatName: string;
  timestamp: number;
};

export type RowingFinishEvent = {
  raceId: number;
  entryId: number;
  boatName: string;
  timestamp: number;
  elapsedMs: number;
};

interface WebSocketContextType {
  sendMessage: (topic: string, message: unknown) => void;
  latestCurrentStates: Array<CurrentState>;
  latestCurrentQueueStates: Array<CurrentQueueState>;
  latestHealthCheckResponses: Array<HealthCheckResponse>;
  liveFlow: LiveFlowState | null;
  isConnected: boolean;
  latestRowingStartEvent: RowingStartEvent | null;
  latestRowingFinishEvent: RowingFinishEvent | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }): ReactElement {
  const wsRef = useRef<WebSocket | null>(null);
  const [latestCurrentStates, setLatestCurrentStates] = useState<Array<CurrentState>>([]);
  const [latestCurrentQueueStates, setLatestCurrentQueueStates] = useState<Array<CurrentQueueState>>([]);
  const [latestHealthCheckResponses, setLatestHealthCheckResponses] = useState<Array<HealthCheckResponse>>([]);
  const [liveFlow, setLiveFlow] = useState<LiveFlowState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestRowingStartEvent, setLatestRowingStartEvent] = useState<RowingStartEvent | null>(null);
  const [latestRowingFinishEvent, setLatestRowingFinishEvent] = useState<RowingFinishEvent | null>(null);

  useEffect(() => {
    const connect = () => {
      const token = getToken();
      const url = token ? `${baseWebSocketUrl}?token=${token}` : baseWebSocketUrl;
      const socket = new WebSocket(url);

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        const content = JSON.parse(event.data as string) as { topic: string; message: string };
        switch (content.topic) {
          case WEBSOCKET_TOPICS.CURRENT_STATE:
            setLatestCurrentStates(JSON.parse(content.message) as Array<CurrentState>);
            break;
          case WEBSOCKET_TOPICS.PRIORITY_QUEUE:
            setLatestCurrentQueueStates(JSON.parse(content.message) as Array<CurrentQueueState>);
            break;
          case WEBSOCKET_TOPICS.HEALTH_CHECK_RESPONSE: {
            const raw = JSON.parse(content.message) as {
              deviceId?: string;
              device?: string;
              status?: string;
              timestamp?: number;
            };
            const response: HealthCheckResponse = {
              deviceId: raw.deviceId ?? raw.device ?? '',
              status: raw.status ?? raw.device ?? '',
              timestamp: raw.timestamp ?? Date.now(),
            };
            setLatestHealthCheckResponses((prev) => {
              const filtered = prev.filter((r) => r.deviceId !== response.deviceId);
              return [...filtered, response];
            });
            break;
          }
          case WEBSOCKET_TOPICS.LIVE_FLOW:
            setLiveFlow(JSON.parse(content.message) as LiveFlowState);
            break;
          case WEBSOCKET_TOPICS.ROWING_START:
            setLatestRowingStartEvent(content.message as unknown as RowingStartEvent);
            break;
          case WEBSOCKET_TOPICS.ROWING_FINISH:
            setLatestRowingFinishEvent(content.message as unknown as RowingFinishEvent);
            break;
          default:
            break;
        }
      };

      socket.onerror = () => {
        setIsConnected(false);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current = socket;
    };

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      wsRef.current?.close();
    };
  }, []);

  const sendMessage = (topic: string, message: unknown): void => {
    const socket = wsRef.current;
    if (socket && isConnected) {
      socket.send(JSON.stringify({ topic, message }));
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        sendMessage,
        isConnected,
        latestCurrentQueueStates,
        latestCurrentStates,
        latestHealthCheckResponses,
        liveFlow,
        latestRowingStartEvent,
        latestRowingFinishEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
