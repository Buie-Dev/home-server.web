# 002 Baseline Tests

## Goal

Lock in current behavior with baseline unit tests before making any behavioral changes to the web app.

## Context

The web app had no tests. The codebase is well-structured with pure utility functions, thin API wrappers over a shared base, hooks that compose API + WebSocket, and 3 context providers — all testable by mocking one layer down.

## Scope

- Install Vitest, @testing-library/react, happy-dom
- Configure vitest.config.ts, tsconfig.test.json, eslint for test files
- Add `npm test` and `npm run test:watch` scripts
- Write baseline tests for all lib utilities, config, API modules, hooks, and contexts
- 26 test files, 260 tests total

## Out of scope

- Component/screen tests (requires more DOM setup and is lower value for baseline coverage)
- Integration tests against real backend
- E2E tests

## Acceptance criteria

- `npm test` passes with all tests green
- No app source files modified (only test files, config, and dev deps)
- Every API module has at least one test
- Every hook has tests for core state management
- All 3 contexts have tests for primary flows
- Config and tokenStorage cover all branches

## Test plan

All tests run via `npm test`. Coverage breakdown:

- **Lib tests (4 files):** date formatting, time/volume formatting, token storage, page paths
- **Config test (1 file):** domain vs IP+port branching
- **API tests (9 files):** base.api, auth, irrigation, history, devices, rowing, todo, events, people
- **Hook tests (9 files):** useHistory, useIrrigation, useDevices, useRowing, useTodo, useEvents, usePeople, useConfirm, useBodyScrollLock
- **Context tests (3 files):** AuthContext, PreferencesContext, WebSocketContext

## Notes

- Uses Vitest (not Jest) for first-class Vite integration
- Uses happy-dom for DOM environment (localStorage, WebSocket, document)
- Test files live in `__tests__/` mirroring `src/` structure
- The useIrrigation hook test uses fake timers with `shouldAdvanceTime: true` to handle the 60-second health check interval
