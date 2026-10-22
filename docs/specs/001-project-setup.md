# 001 Project Setup

## Goal

Set up the spec workflow, PR template, and restructure CLAUDE.md to match the format used in home-server.mobile.

## Context

The repo has an existing `Claude.md` with good architectural guidance but it doesn't follow the format used by home-server.mobile. It needs restructuring to include related repos, boundaries, and the spec workflow. The repo also lacks `docs/specs/` and a PR template.

## Scope

- Rewrite `Claude.md` → `CLAUDE.md` with structured sections: What this repo is, Related repos, Stack, Commands, Environment, Folder layout, Architecture, Code standards, Boundaries, Workflow
- Merge all useful content from the existing `Claude.md`
- Delete old `Claude.md`
- Create `docs/specs/000-template.md` with spec section headers
- Create `.github/pull_request_template.md` with PR section headers
- Create this spec file (`docs/specs/001-project-setup.md`)

## Out of scope

- Changing any application code
- Adding tests
- Modifying build or lint configuration

## Acceptance criteria

- `CLAUDE.md` exists at repo root with all sections listed in Scope
- Old `Claude.md` is deleted
- `docs/specs/000-template.md` exists with headers: Goal, Context, Scope, Out of scope, Acceptance criteria, Test plan, Notes
- `.github/pull_request_template.md` exists with headers: Spec, What changed, How I tested it, What I checked by hand
- No real IPs, domains, or secrets in any file

## Test plan

- Visually review each file for correct structure and content
- Confirm no placeholder IPs, real domains, or secrets appear
- Confirm old `Claude.md` no longer exists

## Notes

Matches the project setup pattern from home-server.mobile spec/001.
