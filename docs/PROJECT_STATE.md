# Project State

## Current phase and verdict

MASTER-02 Fix Loop Round 1 is in progress (2026-09-03). The independent critic findings
M02-P1-01 through M02-P2-05 are being addressed on the supplied MASTER-02 code baseline.
The work covers provider callbacks, API-connected surfaces, safe serialization, complete
admin grant/correction operations, whole-transaction serializable retries, HTTP/browser
coverage, cookie sessions, stable errors, faucet policy resolution, and lifecycle/seed drift.
No Round 2 readiness is claimed until the complete executable gate and self-review finish.

MASTER-02 implementation is in progress on branch `master-02` (2026-09-03).

Planned vertical slice: persistent player profiles and TSC wallets, controlled faucet,
catalog/session/wager/settlement lifecycle, RBAC-protected operations APIs, connected
player/admin surfaces, migrations/seeds, and the complete quality/runtime gate.

Current risks: the scope spans database, API, two web applications, concurrency-sensitive
ledger workflows, and browser/runtime evidence. No MASTER-02 gate is claimed until the
commands recorded at the end of this document have actually run.

## Previous phase

MASTER-01 final quality gate completed on branch `codex/-agents.md` (2026-09-03).

**Verdict: PASS**

**MASTER-02 readiness: READY AFTER MERGE OF PR #1**

The previously blocked dependency, database, browser, and runtime checks have now executed successfully in GitHub Actions and on the target server runtime.

## Verified scope

- PostgreSQL-backed double-entry ledger with serializable transactions, deterministic locking, idempotency, compensation, and append-only protections.
- Persistent authentication with Argon2id password hashing, opaque HMAC sessions, RBAC, audit events, validation, and safe error envelopes.
- PostgreSQL and Redis readiness checks.
- Player/admin Next.js surfaces and shared UI package.
- Production-shaped Docker build and Compose runtime.
- TSC remains a demo-only, non-withdrawable, no-value asset. No real cryptocurrency, deposits, withdrawals, custody, signing, or payments are part of MASTER-01.

## Closed critic findings

- `M01-C-001` P0 — Prisma UUID schema/migration mismatch: fixed and regression-tested.
- `M01-C-002` P1 — Playwright production-mode and viewport coverage gap: fixed; 1440/1024/768/390 are exercised.
- `M01-C-003` P2 — navigation/target-size issues: fixed and browser-tested.
- `M01-C-004` P2 — duplicate-registration audit and production-equivalent HTTP setup: fixed and integration-tested.
- `M01-C-005` P2 — development seed password-hash rotation: fixed and PostgreSQL-tested.
- Docker build gap — Prisma client generation was missing inside the image: fixed by running `pnpm db:generate` before API build.
- Compose networking gap — API container previously inherited localhost database/Redis URLs: fixed with service-network URLs for `postgres` and `redis`.

### Open counts

- P0: 0
- P1: 0
- P2: 0
- P3: 1 non-blocking runtime warning: NestJS `LegacyRouteConverter` auto-converts the middleware wildcard route. Routes and correlation middleware are operational; this should be cleaned up during routine framework maintenance.

## Automated quality gate

GitHub Actions `quality` is green on the Docker-fix head. Verified stages include:

- frozen `pnpm` install
- Prisma generate and validate
- migration + development seed
- production seed fail-closed check
- format check
- ESLint
- strict TypeScript typecheck
- unit tests
- PostgreSQL integration tests
- API smoke test
- production builds
- Playwright e2e on 1440/1024/768/390
- axe accessibility checks
- keyboard navigation
- horizontal-overflow checks
- reduced-motion behavior
- database schema validation

## Server runtime gate

Verified on the target server with Docker Compose:

- clean API image build succeeds
- PostgreSQL 17.6 container healthy
- Redis 8.2.1 container healthy
- foundation migration deploy succeeds
- API container starts successfully on `127.0.0.1:3001`
- `GET /v1/health` returns HTTP 200 with `{ "status": "ok", "service": "api" }`
- `GET /v1/ready` returns HTTP 200 with PostgreSQL and Redis both `true`
- startup logs show all NestJS modules initialized and application started successfully

## Evidence / operational notes

- GitHub Actions is the canonical automated gate.
- Runtime health/readiness endpoints use the global `/v1` prefix.
- PostgreSQL and Redis are not exposed publicly by Compose; API is bound to loopback for this foundation runtime.
- The `.env.example` file contains development/demo placeholders only; production secrets must be provisioned separately before any production deployment.

## Next step

PR #1 may be merged into `main` after confirming its latest GitHub checks remain green. After merge, synchronize the server to `main`, repeat the short health/readiness smoke check, and then begin MASTER-02.

## MASTER-02 implementation snapshot (2026-09-03)

Implemented on `master-02`:

- persistent player profiles/status, per-player `PLAYER_AVAILABLE` accounts, faucet claims,
  catalog, sessions, wagers, and deterministic settlement records;
- atomic serializable ledger-backed faucet, wager, settlement and admin adjustment flows;
- active-only public catalog plus ownership-scoped player wallet/history/session APIs;
- ADMIN operations for Player 360, credit/debit, freeze/unfreeze, ledger/audit, catalog,
  sessions and server-authoritative settlement; FINANCE is limited to adjustments;
- connected player/admin API actions and responsive Midnight Emerald routes with permanent
  test-funds/no-value/non-withdrawable labeling;
- deterministic development seed for system accounts, player profile, and five demo games;
- unit policies and PostgreSQL vertical-slice/concurrent-settlement integration coverage.

### Gate verdict: BLOCKED by execution environment

No code gate is represented as passing unless it completed. The repository dependency install
could not complete because the environment proxy returned HTTP 403 for npm tarballs. This
left package executables unavailable. Docker is also not installed, and no
`TEST_DATABASE_URL` is provisioned. Consequently application builds, database migration,
tests, browser screenshots, the design score, and runtime verification remain unverified;
this is a release-blocking P1 verification gap, not a claimed product PASS.

Executed results:

- PASS: `pnpm format:check`.
- PASS: `git diff --check` and targeted source scans for forbidden crypto, in-memory state,
  direct balance mutation, player payout input, unsafe monetary conversion, and TODO/FIXME.
- BLOCKED: `pnpm install --frozen-lockfile` — npm tarball fetch rejected by proxy (HTTP 403).
- BLOCKED: `pnpm db:generate`, `pnpm --filter @cg/db validate`, `pnpm migrate`, `pnpm seed`,
  `pnpm seed:verify-fail-closed`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`,
  `pnpm test:integration`, `pnpm test:smoke`, `pnpm build`, and `pnpm test:e2e` — dependencies
  unavailable; integration additionally reports missing `TEST_DATABASE_URL`.
- BLOCKED: `docker compose build` and the clean Docker runtime sequence — `docker` command is
  absent.
- BLOCKED: fresh Playwright screenshots and design quality scoring — build/browser runner is
  unavailable because dependency installation is blocked.

### Self-review findings

- P0: 0 identified by static inspection.
- P1: 1 — the full automated, migration, concurrency, browser/design and Docker runtime gates
  are unexecuted due to environment limitations.
- P2: 0 identified by static inspection; cannot be closed independently until gates run.
- P3: existing NestJS wildcard compatibility warning remains unchanged.

## Next step

In an environment with npm registry access, Docker and a disposable PostgreSQL database, run
`pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @cg/db validate`, then the
full MASTER-02 command list and Docker runtime sequence. Fix any surfaced issue before asking
an independent MASTER-02 critic to score the implementation.

## MASTER-02 Fix Loop Round 1 execution (2026-09-03)

Implemented critic fixes: dedicated signed/replay-protected provider simulator and persisted
scenario/events; server provider IDs; complete grant preview/confirm and compensating
correction; transaction-wide serializable retries and stable financial errors; database/ledger
dashboard metrics and audit filters; role management with final-admin protection; convergent
seed fixtures; safe response serialization; HttpOnly cookie sessions; live API player/admin
surfaces; completed/cancelled sessions; HTTP, concurrency/policy, serializer and connected UI
tests; ADR-002 resolves the controlled faucet policy explicitly.

### Executed gate

- PASS: frozen dependency install, Prisma generate, Prisma schema validate, format, ESLint,
  strict typecheck, 23 unit tests, API smoke test, production API/web/admin builds, and
  production seed fail-closed verification.
- BLOCKED: migration, development seed, PostgreSQL integration/HTTP/concurrency tests because
  this environment has no PostgreSQL service and no Docker CLI. Attempts failed with Prisma
  P1001 at `127.0.0.1:5432`; no test result is claimed.
- BLOCKED: Playwright/axe/responsive screenshots because the environment has no browser binary
  and the proxy rejects Playwright Chromium downloads with HTTP 403. The runner started and
  failed before test execution; no browser PASS or design score is claimed.
- BLOCKED: Docker clean-build/runtime/health/readiness sequence because `docker` is absent.

### Current risk verdict

P0 identified: 0. P1/P2 implementation findings from the critic were addressed in code and
coverage, but independent closure remains blocked until PostgreSQL and browser/Docker gates
execute. Do not merge on the basis of this local environment alone.

### Next command

On a Docker-capable runner: `docker compose down -v --remove-orphans && docker compose build
--no-cache`, then migrate/seed/up, run `pnpm quality`, capture all four viewport screenshots,
and send the resulting commit to MASTER-02 Critic Round 2.

## MASTER-02 Fix Loop Round 2 (2026-09-03)

Round 2 moves provider replay claiming, wager/session validation, provider ordering, event
persistence, settlement/refund ledger posts, state transitions and audit into one retried
serializable transaction. Canonical callback payloads are HMAC-authenticated and concurrent
same-event delivery is idempotent while changed payloads conflict. Generic correction is now
limited to test-fund/admin adjustment transactions. Grant confirmation binds the ledger
idempotency record to preview identity and payload and replays an executed preview even after
its expiry. Session cancellation locks the session and only permits `ACTIVE -> CANCELLED`
without an accepted wager. Last-admin removal is serialized with a database advisory lock.

The admin UI now provides connected correction, provider simulation, audit filter, role and
grant-limit/error workflows. The player wager flow polls its ownership-scoped API until the
server/admin-controlled provider resolves it, then refreshes wallet, transactions and session
state. Playwright now starts the real API and includes an unmocked browser/API/PostgreSQL
vertical slice; mocked surface tests remain classified only as surface tests.

Focused PostgreSQL coverage was added for callback replay/conflict/COMMIT concurrency and
atomic rollback, freeze-after-reserve, grant confirmation/expiry/daily-limit concurrency,
correction restrictions/replay, last-admin concurrency, and session terminal states. No schema
migration was required in this round.

Gate results for this round are recorded in the final handoff for the commit. Local PostgreSQL,
Docker and Chromium availability must not be inferred from the implementation itself.

### Round 2 local gate result

- PASS: frozen install, Prisma generation, schema validation with an explicit disposable
  PostgreSQL URL, format, lint, strict typecheck, all 23 unit tests, API smoke, production
  builds, and `git diff --check`.
- BLOCKED: PostgreSQL integration tests because `TEST_DATABASE_URL` is not configured locally.
- BLOCKED: Playwright real/surface/responsive/axe execution because the API cannot initialize:
  no PostgreSQL server is reachable at `127.0.0.1:5432` (Prisma P1001). This also blocks fresh
  screenshots; no E2E or visual PASS is claimed.
- The first bare Prisma validation attempt was blocked because `DATABASE_URL` was absent; the
  same schema validation passed when supplied the documented disposable local URL. The first
  format check found the newly added integration test unformatted; it was formatted and the
  complete format check then passed. The implementation was not weakened to bypass either gate.
