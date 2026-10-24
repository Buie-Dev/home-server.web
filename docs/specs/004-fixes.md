# 004 Fixes

## Goal

Fix bugs from phase 2 notes, remove hardcoded secrets/IPs/domains, and run gitleaks.

## Context

The baseline test spec (002) did not flag any bugs. The codebase was reviewed for hardcoded credentials, real IPs, real domains, and logged secrets.

## Scope

- Run gitleaks over full history
- Scan for hardcoded IPs, domains, passwords, and logged credentials
- Replace real domain in `.env.example` comment with `example.com`

## Out of scope

- History rewriting for gitleaks findings (none found)

## Acceptance criteria

- gitleaks reports no leaks
- No real IPs, domains, or secrets in source code or config
- `.env.example` uses only placeholder values
- Baseline tests still pass

## Test plan

- `gitleaks detect --source . -v` reports no leaks
- `npm test` passes

## Notes

- gitleaks: 14 commits scanned, no leaks found
- No bugs were noted in the 002-baseline-tests spec
- `.env.example` domain was already replaced with `example.com` in phase 5
- No hardcoded IPs, domains, or secrets found in source code
- No credentials logged to console
- This phase required no code changes beyond the spec file
