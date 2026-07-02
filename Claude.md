# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dandelion Lane Irrigation Web — a React web app for controlling and monitoring the home irrigation system hosted at dandelionlane.ca. Uses the same `homeserver.api` (REST) and `homewebsocket.api` (WebSocket) backend as the HomeApp mobile app.

**Tech Stack:** React 19, TypeScript, Vite 6, React Router 7, Axios, Material-UI 7, SCSS Modules, dayjs

## Development Commands

```bash
npm install          # First-time setup
npm run dev          # Dev server (all interfaces)
npm run build        # Production build (tsc + vite)
npm run preview      # Preview production build
npm run lint         # ESLint (auto-fix)
npm run format       # Prettier
npm run preCommit    # format + lint
```

**Note:** Requires `.env` file (see `.env.example`). Copy and fill in your server IPs.

## Architecture & Key Patterns

### Import Path Aliases

Vite auto-generates aliases for all `src/` subdirectories:

```typescript
// ✓ Correct
import Layout from 'components/Layout/Layout';
import useIrrigation from 'hooks/useIrrigation.hook';
import { PAGE_PATHS } from 'lib/pagesPaths';

// ✗ Wrong
import Layout from '../../components/Layout/Layout';
```

### API Layer Architecture

**Base API (`src/api/base.api.ts`):**
- Axios wrapper with automatic Bearer token injection
- 401 responses trigger `onUnauthorized` → logout
- Methods: `get`, `post`, `put`, `del`

**Route Constants (`src/api/routes.ts`):**
- All endpoints defined as constants using `baseAPIUrl` from config
- Never hardcode API paths

**Config (`src/config/config.ts`):**
- `baseAPIUrl` and `baseWebSocketUrl` derived from `VITE_*` env vars
- Supports both local dev (`VITE_SERVER:VITE_API_PORT`) and production domain (`VITE_DOMAIN`)

### Authentication

**AuthContext (`src/context/AuthContext.tsx`):**
- JWT stored in `localStorage` via `lib/tokenStorage.ts`
- `useAuth()` exposes `isAuthenticated`, `isLoading`, `login()`, `logout()`
- 401 API responses auto-trigger logout

**Protected routes:** Layout component redirects unauthenticated users to `/login`

### WebSocket

**WebSocketContext (`src/context/WebSocketContext.tsx`):**
- Single WS connection for entire app lifetime
- Reconnects on `document.visibilitychange` (tab focus)
- Auth via `?token=<jwt>` query param
- Topics: `current`, `priorityQueue`, `healthcheck/response`, `liveFlow`
- `useWebSocket()` exposes: `sendMessage`, `latestCurrentStates`, `latestCurrentQueueStates`, `latestHealthCheckResponses`, `liveFlow`, `isConnected`

### Date Handling (CRITICAL)

**Always use `lib/date` (dayjs wrapper):**

```typescript
// ✓ Correct
import { formatDate, dateFormats } from 'lib/date';
formatDate(run.startedAt, dateFormats.abbreviatedPrettyWithWeekday);

// ✗ Wrong
new Date(run.startedAt).toLocaleDateString();
```

### SCSS Architecture

```scss
@use 'scss/base/colors' as *;
@use 'scss/base/sizes' as *;

.container {
  .child {
    color: $color-primary;
    padding: $spacing-md;
    border-radius: $radius-md;
  }
}
```

**Rules:**
- Always use SCSS variables — never hardcode colors or spacing
- Primary brand color: `$color-primary: #2196F3`
- Create SCSS classes for all styling — no inline styles, no MUI `sx` prop
- Use proper nesting following component hierarchy
- Never repeat CSS across similar classes — use base + modifier classes

### Custom Hooks Architecture

All data fetching goes through hooks — never call API functions directly in components.

```typescript
const { zones, priorityQueue, fetchZones, stopAll } = useIrrigation();
const { history, totals, fetchHistory, loadMore } = useHistory();
const { devices, fetchDevices, checkConnectivity } = useDevices();
```

### Routing

Routes defined in `src/App.tsx` using `createBrowserRouter`. Path constants in `src/lib/pagesPaths.ts`:

```typescript
import { PAGE_PATHS } from 'lib/pagesPaths';
// PAGE_PATHS.ZONES, PAGE_PATHS.SCHEDULES, PAGE_PATHS.LIVE, PAGE_PATHS.HISTORY, PAGE_PATHS.DEVICES, PAGE_PATHS.LOGIN
```

**Never hardcode paths.**

### Material-UI Integration

```typescript
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';

<IconButton onClick={handleClick} size="small">
  <EditIcon className={styles.editIcon} />
</IconButton>
```

```scss
.editIcon {
  color: $color-primary;
}
```

**Do not use:** MUI `color` prop, `sx` prop, or inline `style` attribute.

## Navigation (5 tabs)

`Zones` | `Schedules` | `Live` | `History` | `Devices`

- Desktop (≥768px): left sidebar
- Mobile (<768px): bottom tab bar

## Code Style

**Prettier:** single quotes, 120 char width, semicolons, ES5 trailing commas

**TypeScript:**
- Functional components with `ReactElement` return type
- Define interfaces for component props
- No `any` types

**Component Organization:**
```typescript
// 1. Imports
// 2. Interfaces
// 3. Component
// 4. Export default
```

## Never Do

1. Use `new Date()` for formatting — use `lib/date` (dayjs)
2. Hardcode API routes or page paths — use constants
3. Use inline styles — use SCSS classes
4. Use MUI `sx` prop or `color` prop
5. Use relative imports for `src/` — use path aliases
6. Use single-letter variable names (`d`, `s`, `t`)
7. Use nested ternaries — use helper functions
8. Repeat CSS across similar classes — use base + modifier classes
9. Hardcode colors — use SCSS variables

## Always Do

1. Read files before editing
2. Use `lib/date` for all date formatting
3. Use SCSS modules with proper nesting
4. Import from custom hooks — never call API directly in components
5. Use proper TypeScript types
6. Ensure responsive layout — compatible from 320px (mobile) to desktop
7. Use route constants from `lib/pagesPaths`
8. Use API endpoint constants from `api/routes`
