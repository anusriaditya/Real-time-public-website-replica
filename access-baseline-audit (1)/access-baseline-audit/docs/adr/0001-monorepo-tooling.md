# ADR 0001: pnpm workspaces + Turborepo for the monorepo

**Status:** Accepted
**Date:** 2026-09-13

## Context

The project needs `client`, `server`, and `shared` to live in one repo with
one `git history`, one PR review flow, and a shared TypeScript contract
between frontend and backend, without the contract drifting between two
separately-versioned npm packages.

## Options considered

| Option | Why not |
|---|---|
| Two separate repos + published npm package for shared types | Publishing a private package for a 2-person student team is pure overhead — a version bump + publish step for every type change, for zero benefit at this scale. |
| npm workspaces only, no task runner | Works, but every `dev`/`build`/`test` across packages has to be scripted by hand with `--workspace` flags, and there's no caching — `tsc` reruns cold every time even if nothing in that package changed. |
| Nx | Excellent at large scale, but its plugin/generator model is more machinery than a 4-package student project needs, and the learning curve competes with time better spent on the actual feature. |
| **pnpm workspaces + Turborepo** (chosen) | pnpm's content-addressable store means `client` and `server` don't each get their own full copy of `react`/`express`'s transitive deps, and its strict `node_modules` layout (no phantom dependencies) means "works on my machine" bugs from silently relying on a hoisted package get caught immediately. Turborepo adds task orchestration (`turbo run build` builds `shared` before `server` because of `dependsOn: ["^build"]`) and local caching, with a single, small `turbo.json`. |

## Decision

pnpm workspaces (`pnpm-workspace.yaml`) for dependency management and
linking `@access-audit/shared` into `client`/`server`/`test` via
`workspace:*`; Turborepo (`turbo.json`) for task running and caching.

## Consequences

- Contributors need `corepack enable` once (ships with Node ≥ 16.13) instead
  of a bare `npm install` — documented as step 0 in `docs/README.md` so
  it's never a silent blocker.
- `workspace:*` protocol means `shared` is never accidentally pulled from
  the public npm registry under the same name — it's a hard compile error
  if the workspace link breaks, not a silent wrong-version install.
- Turborepo's cache is local-only in this setup (no remote cache configured)
  since the team is small; revisit if CI build times become a bottleneck.
