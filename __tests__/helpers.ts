import type { WebSocketContextType } from 'context/WebSocketContext';

export const mockWebSocketValue: WebSocketContextType = {
  sendMessage: vi.fn(),
  latestCurrentStates: [],
  latestCurrentQueueStates: [],
  latestHealthCheckResponses: [],
  liveFlow: null,
  isConnected: true,
  latestRowingStartEvent: null,
  latestRowingFinishEvent: null,
};

export const resetWebSocketMock = (): void => {
  mockWebSocketValue.sendMessage = vi.fn();
  mockWebSocketValue.latestCurrentStates = [];
  mockWebSocketValue.latestCurrentQueueStates = [];
  mockWebSocketValue.latestHealthCheckResponses = [];
  mockWebSocketValue.liveFlow = null;
  mockWebSocketValue.isConnected = true;
  mockWebSocketValue.latestRowingStartEvent = null;
  mockWebSocketValue.latestRowingFinishEvent = null;
};
