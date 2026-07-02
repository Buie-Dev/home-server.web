const domain = import.meta.env.VITE_DOMAIN;
const server = import.meta.env.VITE_SERVER;
const apiPort = import.meta.env.VITE_API_PORT;
const wsServer = import.meta.env.VITE_WEBSOCKET;
const wsPort = import.meta.env.VITE_WS_PORT;

export const baseAPIUrl = domain ? `https://${domain}/api` : `http://${server}:${apiPort}`;

export const baseWebSocketUrl = domain ? `wss://${domain}/ws` : `ws://${wsServer}:${wsPort}`;
