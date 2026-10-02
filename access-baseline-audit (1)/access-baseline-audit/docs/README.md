# Architecture

This repo is the accessible, maintainable foundation that came out of the audit
in [`accessibility-audit-report.md`](./accessibility-audit-report.md). It's a
small "route status" app for Chennai city buses — deliberately simple, so the
architecture and the accessibility patterns are the point, not the feature set.

## System boundaries

Four packages, one job each, wired together with pnpm workspaces:

```
client   -> renders UI, owns no business logic, talks to server only via /api/*
server   -> owns business logic + persistence, exposes a versioned-by-convention REST API
shared   -> the contract both sides agree on: zod schemas + inferred TS types
test     -> black-box E2E/a11y checks against a running client+server, owns neither
```

**client/** is a Vite + React SPA. It is not allowed to talk to the database,
know SQL, or duplicate validation logic — its only job is to call `server`'s
HTTP API and render the result accessibly. If a rule like "a message can't
exceed 280 characters" needs to exist on the client (e.g., a form), it imports
that rule from `shared`, it does not reinvent it.

**server/** is a layered Express app: `routes -> controller -> service -> db`.
Routes only wire URLs to controllers. Controllers only translate HTTP
(`req`/`res`) to and from plain function calls. Services hold the actual
business logic and are the only layer allowed to touch `db/client.ts`. This
means the business logic is testable without spinning up HTTP at all — you
can unit test `service-status.service.ts` by calling it directly.

**shared/** exists because the alternative — hand-writing matching TypeScript
interfaces in `client` and `server` independently — silently drifts the
moment one side changes and nobody notices until a bug report. One zod schema
defines the shape once; the server validates real data against it at
runtime, and the client gets the exact same type for free via `z.infer`.

**test/** is intentionally outside both `client` and `server`. It only knows
about the running app from the outside (HTTP + DOM), the same way a real user
or screen reader does. That's what makes it a meaningful accessibility
regression check instead of a mock-everything unit test that can't catch a
missing `<h1>`.

### What's explicitly out of scope for v1

- **Auth** — not implemented. The vertical slice below shows exactly where
  `req.user` would be read once it exists (`middleware/` is where an
  `authGuard.ts` would slot in, before the controller).
- **A real production database** — `better-sqlite3` is used for its zero-ops
  simplicity. `server/src/db/client.ts` is the *only* file that would change
  to move to Postgres; nothing in `services/` or above touches SQL directly
  outside that boundary... actually it does touch SQL (see note in that
  file) — the point is it's the *only* file that would need to.

## Local setup

Requires Node.js ≥ 20 and pnpm ≥ 9 (see below if you don't have pnpm).

```bash
# 0. one-time: enable pnpm via corepack (ships with Node 16.13+)
corepack enable
corepack prepare pnpm@9.12.0 --activate

# 1. clone and install every workspace package in one shot
git clone <your-fork-url> access-baseline-audit
cd access-baseline-audit
pnpm install

# 2. configure the server
cp server/.env.example server/.env
# defaults work as-is for local dev, no edits required

# 3. run client + server together (turbo runs both dev scripts in parallel)
pnpm dev
#   -> server: http://localhost:4000  (SQLite file auto-created + migrated on first boot)
#   -> client: http://localhost:5173  (proxies /api/* to the server)

# 4. in a second terminal: run the accessibility + type checks
pnpm typecheck                 # tsc --noEmit across every package
pnpm --filter @access-audit/test exec playwright install --with-deps
pnpm test:e2e                  # axe-core scan + keyboard-only checks
```

If you don't want two terminals: `pnpm dev` blocks, so run step 4 separately
after starting it, or run `pnpm build && pnpm --filter @access-audit/server start`
for a one-shot production-mode boot instead.

## First vertical feature slice: route status

This is the one feature implemented end-to-end, and it's meant to be read as
the template for every feature after it. Trace it in this order:

1. **Schema is the source of truth** — [`shared/src/index.ts`](../shared/src/index.ts)
   defines `ServiceAlertSchema` with zod. This is written *before* any
   database or UI code, on purpose: it's the contract everything else is
   checked against.

2. **Data lives in SQLite** — [`server/src/db/migrations/001_init.sql`](../server/src/db/migrations/001_init.sql)
   creates `service_alerts` and seeds three rows so the feature is demoable
   immediately. [`server/src/db/client.ts`](../server/src/db/client.ts) opens
   the connection and runs any un-applied migration on boot.

3. **Service layer queries + validates** — [`service-status.service.ts`](../server/src/modules/service-status/service-status.service.ts)
   runs the SQL and parses every row through `ServiceAlertSchema` before it
   leaves the database boundary. A malformed row fails loudly here, not
   after being sent to a user.

4. **Controller translates HTTP** — [`service-status.controller.ts`](../server/src/modules/service-status/service-status.controller.ts)
   calls the service, wraps the result in the shared response envelope, and
   sets the HTTP status. It contains zero business logic.

5. **Route wires the URL** — [`service-status.routes.ts`](../server/src/modules/service-status/service-status.routes.ts)
   maps `GET /api/service-alerts` and `GET /api/service-alerts/:id` to the
   controller functions. Mounted in [`app.ts`](../server/src/app.ts).

6. **Client fetches through one typed function** — [`client/src/lib/api.ts`](../client/src/lib/api.ts)
   is the *only* place in the client that calls `fetch()`. It re-validates
   the response against the same shared schema and returns a discriminated
   `{ ok: true, alerts }` / `{ ok: false, error }` result — no component
   ever has to guess whether `data` might be `undefined`.

7. **UI renders it accessibly** — [`App.tsx`](../client/src/App.tsx) owns
   loading/error/ready state and an `aria-live="polite"` status region.
   [`ServiceAlertList.tsx`](../client/src/components/ServiceAlertList.tsx)
   renders each alert with a unique heading and a status conveyed by *text*,
   not color alone — the direct fix for Audit Issue #2.

8. **Test proves it stays that way** — [`homepage-accessibility.spec.ts`](../test/e2e/specs/homepage-accessibility.spec.ts)
   runs an automated axe-core scan and three manual-pattern checks (skip
   link focus order, heading hierarchy, unique accessible names) against
   the real running app, so a future PR that reintroduces Issue #2 or #5
   fails CI instead of failing an end user.

If you add a second feature, it should look like steps 1–8 with a different
noun. If it doesn't fit that shape, that's a signal to revisit the boundary,
not to make an exception.
