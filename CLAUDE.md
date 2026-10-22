# CLAUDE.md

## What this repo is

React web app for controlling the home server and sharing features (like rowing) with other users. Runs in the browser. Authenticates via JWT, then talks to two backend services over the local network or through a Cloudflare domain.

Shares the same backend as `home-server.mobile`.

## Related repos

- `home-server.mobile` — React Native mobile app (iOS + Android), same feature set
- `home-server.api` — Flask REST API (port 5001), handles schedules, zones, history, devices, auth
- `homewebsocket.api` — Python WebSocket server (port 8765), bridges WebSocket to MQTT

## Stack

- React 19, TypeScript 5, Vite 6
- React Router 7 (createBrowserRouter)
- MUI 7 (icons and interactive components only — all styling via SCSS)
- SCSS Modules for styling
- dayjs for dates
- Axios for REST

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server (all interfaces)
npm run build        # Production build (tsc + vite)
npm run preview      # Preview production build
npm run lint         # ESLint (auto-fix)
npm run format       # Prettier
npm run preCommit    # format + lint
```

No test command yet.

## Environment

`.env` at repo root (not committed). Copy `.env.example` and fill in values.

| Variable | Purpose |
|---|---|
| `VITE_SERVER` | Home server IP for REST API |
| `VITE_API_PORT` | REST API port (5001) |
| `VITE_WEBSOCKET` | Home server IP for WebSocket |
| `VITE_WS_PORT` | WebSocket port (8765) |
| `VITE_DOMAIN` | Optional production domain, overrides IP+port vars |

When `VITE_DOMAIN` is set, REST uses `https://<domain>/api` and WebSocket uses `wss://<domain>/ws`. Otherwise it connects directly to the IP and port.

## Folder layout

```
src/
  App.tsx                          Router + route definitions
  main.tsx                         Entry point
  api/
    base.api.ts                    Axios instance with JWT interceptor
    routes.ts                      URL constants (all endpoints)
    auth.api.ts                    Login
    irrigation.api.ts              Zones, schedules
    history.api.ts                 Irrigation run history
    devices.api.ts                 Device registry
    rowing.api.ts                  Rowing races, crews, boats
    todo.api.ts                    To-do tasks
    events.api.ts                  Events
    people.api.ts                  People
  components/
    Layout/                        App shell — sidebar (desktop) / bottom tabs (mobile)
    PageContainer/                 Page wrapper with title
    ConfirmModal/                  Generic confirmation dialog
    DeleteConfirmationModal/       Destructive-action confirmation
    CreateScheduleModal/           Schedule creation form
    ManualIrrigationModal/         Manual zone run form
    EmptyState/                    Empty list placeholder
    LoadingSpinner/                Loading indicator
    ZoneSubzoneFilter/             Zone/subzone filter controls
  config/
    config.ts                      Reads .env, exports baseAPIUrl and baseWebSocketUrl
  context/
    AuthContext.tsx                 Auth state, login/logout, token in localStorage
    WebSocketContext.tsx            Single WS connection, message relay
    PreferencesContext.tsx          User preferences (units, etc.)
  hooks/
    useIrrigation.hook.ts          Zones, schedules, queue
    useHistory.hook.ts             Irrigation run history
    useDevices.hook.ts             Device registry + health checks
    useRowing.hook.ts              Rowing races, crews, boats
    useTodo.hook.ts                To-do tasks
    useEvents.hook.ts              Events
    usePeople.hook.ts              People
    useConfirm.hook.ts             Confirmation dialog state
    useBodyScrollLock.hook.ts      Lock body scroll when modals open
  lib/
    date.ts                        dayjs wrapper — formatDate, dateFormats
    datetime.ts                    Date formatting helpers
    pagesPaths.ts                  Route path constants (PAGE_PATHS)
    tokenStorage.ts                localStorage wrapper for JWT
  screens/
    Login/                         Auth screen
    Irrigation/                    Irrigation landing (tab container)
    Zones/                         Zone list + manual run
    Schedules/                     Schedule list + create/edit
    Queue/                         Live irrigation queue
    History/                       Irrigation run history
    Devices/                       Device registry + health checks
    Rowing/                        Rowing.tsx, RaceTimer.tsx, StrokeRate.tsx
    ToDo/                          To-do tasks
    Events/                        Events
    People/                        People
    Permissions/                   User permissions admin
  scss/
    global.scss                    Global styles
    base/
      _colors.scss                 Color variables ($color-primary, etc.)
      _sizes.scss                  Spacing, radius, breakpoint variables
```

## Architecture

### Auth

Login via `POST /auth/login` returns a JWT. Stored in `localStorage` via `lib/tokenStorage.ts`. Axios interceptor in `base.api.ts` attaches `Authorization: Bearer <token>` to every request. On 401, AuthContext triggers logout. WebSocket connects with `?token=<token>`.

Protected routes: Layout component redirects unauthenticated users to `/login`.

### State management

React Context + custom hooks. No Redux.

- `AuthContext` — auth state, login/logout
- `WebSocketContext` — single WS connection, exposes `sendMessage` and latest state for zones, queue, health checks, live flow
- `PreferencesContext` — user preferences (units, etc.)

### WebSocket

Single connection for the app lifetime. Reconnects on `document.visibilitychange` (tab focus). Auth via `?token=<jwt>` query param.

Topics received: `current`, `priorityQueue`, `healthcheck/response`, `liveFlow`
Topics sent: `request`, `stop`, `stopAll`, `healthcheck/request`

`useWebSocket()` exposes: `sendMessage`, `latestCurrentStates`, `latestCurrentQueueStates`, `latestHealthCheckResponses`, `liveFlow`, `isConnected`

### API pattern

`api/routes.ts` defines URL constants. `api/*.api.ts` files are thin wrappers over `api/base.api.ts`. `hooks/use*.hook.ts` files consume the API files and expose state + actions to screens. Components never call API functions directly.

### Routing

Routes defined in `src/App.tsx` using `createBrowserRouter`. Path constants in `src/lib/pagesPaths.ts`.

```typescript
import { PAGE_PATHS } from 'lib/pagesPaths';
```

Never hardcode paths.

### Navigation

`Zones` | `Schedules` | `Live` | `History` | `Devices` — plus Rowing, ToDo, Events, People, Permissions.

- Desktop (>=768px): left sidebar
- Mobile (<768px): bottom tab bar

### Date handling

Always use `lib/date` (dayjs wrapper). Never use `new Date()` for formatting.

```typescript
import { formatDate, dateFormats } from 'lib/date';
formatDate(run.startedAt, dateFormats.abbreviatedPrettyWithWeekday);
```

### SCSS architecture

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

- Always use SCSS variables — never hardcode colors or spacing
- Primary brand color: `$color-primary: #2196F3`
- Create SCSS classes for all styling — no inline styles, no MUI `sx` prop
- Use proper nesting following component hierarchy
- Never repeat CSS across similar classes — use base + modifier classes

### MUI integration

Use MUI for icons and interactive components only. Style everything via SCSS classes.

```typescript
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';

<IconButton onClick={handleClick} size="small">
  <EditIcon className={styles.editIcon} />
</IconButton>
```

Do not use: MUI `color` prop, `sx` prop, or inline `style` attribute.

## Code standards

**Imports:** All imports at the top of the file, never inline. Use path aliases (not relative imports for `src/`).

```typescript
// Correct
import Layout from 'components/Layout/Layout';
import useIrrigation from 'hooks/useIrrigation.hook';

// Wrong
import Layout from '../../components/Layout/Layout';
```

**Parameters:** All function parameters use object destructuring with a named type. No positional parameters.

**Prettier:** single quotes, 120 char width, semicolons, ES5 trailing commas.

**TypeScript:**
- Functional components with `ReactElement` return type
- Define interfaces for component props
- No `any` types

**Component file organization:**
1. Imports
2. Interfaces
3. Component
4. Export default

**Never do:**
1. Use `new Date()` for formatting — use `lib/date`
2. Hardcode API routes or page paths — use constants
3. Use inline styles — use SCSS classes
4. Use MUI `sx` prop or `color` prop
5. Use relative imports for `src/` — use path aliases
6. Use single-letter variable names
7. Use nested ternaries — use helper functions
8. Repeat CSS across similar classes — use base + modifier classes
9. Hardcode colors — use SCSS variables

**Always do:**
1. Read files before editing
2. Use `lib/date` for all date formatting
3. Use SCSS modules with proper nesting
4. Import from custom hooks — never call API directly in components
5. Use proper TypeScript types
6. Ensure responsive layout — 320px mobile to desktop
7. Use route constants from `lib/pagesPaths`
8. Use API endpoint constants from `api/routes`

## Boundaries

- Never push. Give me the commands and wait.
- Never change app behavior unless the spec says to.
- Never commit .env files, secrets, real domains, real IPs or hostnames.
- Never merge a pull request.
- Only write things that are true in the code.

## Workflow

Changes follow the spec loop. Write a spec in `docs/specs/NNN-short-name.md`, get approval, branch `spec/NNN-short-name` from dev, do the work, commit, then give me the push and PR commands.

Commit messages are imperative, sentence case. No Co-Authored-By trailer or any AI attribution on commits.

Two long-lived branches: `main` (stable) and `dev` (ongoing work). Spec branches are named `spec/NNN-short-name`, branch from dev and merge back into dev.
