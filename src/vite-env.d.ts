/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER: string;
  readonly VITE_API_PORT: string;
  readonly VITE_WEBSOCKET: string;
  readonly VITE_WS_PORT: string;
  readonly VITE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
