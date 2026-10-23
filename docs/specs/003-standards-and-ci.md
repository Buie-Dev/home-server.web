# 003 Standards and CI

## Goal

Apply formatting and lint standards, add GitHub Actions CI, and clean up .gitignore and .env.example.

## Context

Prettier and ESLint were configured in phase 1 but never enforced across the full codebase. 43 files have formatting drift. ESLint reports 8 errors (unused vars) and 34 warnings (missing hook deps, `any` types, react-refresh context exports).

## Scope

- Run Prettier across all source files (formatting commit)
- Fix lint errors and suppress warnings that don't fit the project (lint commit)
- Add `.github/workflows/ci.yml` for lint + test on push/PR to main and dev
- Ensure `.gitignore` covers `secrets/`
- Verify `.env.example` uses placeholder values

## Out of scope

- Behavior changes to app code
- Fixing the `react-hooks/exhaustive-deps` warnings (these are intentional mount-only effects)
- Replacing all `any` types (tracked separately)

## Acceptance criteria

- `npm run format` produces no changes
- `npx eslint .` reports zero errors
- Baseline tests still pass unchanged
- CI workflow runs lint and tests on push/PR to main and dev
- `.gitignore` includes `secrets/`

## Test plan

- `npm run format && npm run lint && npm test` all pass
- Review CI YAML for correct triggers and steps

## Notes

- `react-hooks/exhaustive-deps` warnings are suppressed per-line where the mount-only pattern is intentional
- `react-refresh/only-export-components` disabled for context files in eslint config (standard React pattern)
- `@typescript-eslint/no-explicit-any` left as warning, not error (gradual typing)
- The real domain in `.env.example` comment will be replaced with `example.com`
