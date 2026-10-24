![CI](https://github.com/Buie-Dev/home-server.web/actions/workflows/ci.yml/badge.svg?branch=dev)

# home-server.web

Web app for controlling my home server systems from a browser.

## Why I built it

I built the mobile app first, but I wanted a few other people to have access to features like rowing and irrigation without needing to install anything. This web app gives them a browser-based interface to the same backend.

## How it fits

This is one of two frontends that talk to the same backend services. Both connect to the REST API for data and the WebSocket server for real-time state.

- [home-server.mobile](https://github.com/Buie-Dev/home-server.mobile) is the React Native app for iOS and Android
- [home-server.api](https://github.com/Buie-Dev/home-server.api) is the Flask REST API that handles schedules, zones, history, devices, rowing, and auth
- [homewebsocket.api](https://github.com/Buie-Dev/homewebsocket.api) is the Python WebSocket server that bridges WebSocket connections to MQTT

## Stack

- React 19
- TypeScript 5
- Vite 6
- React Router 7
- MUI 7 (icons and interactive components only)
- SCSS Modules
- dayjs
- Axios

## Running it locally

1. Clone the repo and install dependencies

```bash
git clone https://github.com/Buie-Dev/home-server.web.git
cd home-server.web
npm install
```

2. Copy `.env.example` to `.env` and fill in the values for your home server

```bash
cp .env.example .env
```

3. Start the dev server

```bash
npm run dev
```

The app runs on all network interfaces so you can open it from other devices on the same network.

## Configuration

| Variable | Purpose |
|---|---|
| `VITE_SERVER` | Home server IP for the REST API |
| `VITE_API_PORT` | REST API port (5001) |
| `VITE_WEBSOCKET` | Home server IP for the WebSocket server |
| `VITE_WS_PORT` | WebSocket port (8765) |
| `VITE_DOMAIN` | Optional production domain, overrides the IP and port variables |

When `VITE_DOMAIN` is set, REST calls go to `https://<domain>/api` and the WebSocket connects to `wss://<domain>/ws`. Otherwise it connects directly to the IP and port.

## Tests

```bash
npm test             # Run all tests
npm run test:watch   # Run in watch mode
```

Tests use Vitest with happy-dom. 26 test files cover all utilities, API modules, hooks, and context providers.

## How I work on it

Changes start as specs in `docs/specs/`. Claude Code implements them on a branch and I review and merge every pull request.
