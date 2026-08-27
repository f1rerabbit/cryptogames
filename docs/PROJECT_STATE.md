# Project State

## Current phase and verdict

MASTER-01 implementation remediation completed on branch `work` (2026-08-27).

**READY FOR MASTER-01 CRITIC**

Do not start MASTER-02. The implementation blockers found by the previous audit have been replaced with production-shaped PostgreSQL/auth/readiness/browser infrastructure. No known implementation gaps remain from MASTER-01; execution still blocked in this Codex environment is listed explicitly below and must run in CI or another environment before merge.

## Implemented foundation

- pnpm workspace with Next.js player/admin, NestJS API, and db/contracts/config/ui/test packages.
- PostgreSQL-backed runtime identity, opaque HMAC-hashed sessions, roles, auth audit, explicit public routes, and deny-by-default RBAC.
- HTTP registration, login, current user, session list, logout, and own-session revocation workflows.
- PostgreSQL-backed TSC ledger using serializable Prisma transactions, deterministic account row locks, derived non-negative balances, balanced bigint entries, persisted scoped idempotency, append-only triggers, and compensating transactions.
- `/health` process liveness and fail-closed `/ready` checks for both PostgreSQL and Redis.
- Safe structured Pino logging with credential/token redaction, correlation IDs, validation, safe errors, Helmet, and CORS allowlist.
- Development/test-only seed with Argon2id credentials supplied from environment and a separately testable fail-closed mode policy.
- Playwright desktop/mobile player/admin smoke, axe accessibility, keyboard navigation, and screenshot artifact infrastructure.
- CI for clean PostgreSQL/Redis, Prisma generation/validation, migration, seed, production seed rejection, Chromium install, complete quality gate, and production builds.

## Fixed defects

1. Removed the in-memory ledger runtime and implemented transactional PostgreSQL persistence.
2. Added persisted idempotency and bound compensation idempotency hashes to the original transaction ID.
3. Added deterministic row locking and serializable retries for concurrent balance safety.
4. Added real PostgreSQL integration tests for zero-sum amounts, duplicate/colliding keys, concurrent debits, insufficient balance, compensation, and append-only database triggers.
5. Removed in-memory identity/session/audit runtime storage and added persistent HTTP auth workflows with Argon2id and opaque session hashes.
6. Made auth success plus session/user mutation transactional with its audit event; denied login is also audited.
7. Made readiness fail closed on either PostgreSQL or Redis failure and added unit tests.
8. Added Playwright, axe, desktop/mobile projects, keyboard tests, and screenshot output.
9. Added root typecheck coverage for test/config scripts, explicit PostgreSQL test-database enforcement, and manifest dependencies for each workspace.
10. Corrected the production-seed verification script so an unrelated command failure cannot be mistaken for policy rejection.
11. Added missing migration indexes and append-only protection for persisted idempotency records.
12. Updated architecture, ADR, runbook, design evidence, and CI to match actual runtime behavior.

## Quality gate — 2026-08-27

### PASS

- `pnpm format:check`
- `git diff --check`
- `node --experimental-strip-types --input-type=module -e '…assertSeedAllowed…'` verified development/test allow and undefined/production/staging rejection without third-party dependencies.
- Secret-pattern scan of tracked implementation files found no private keys or common committed credential/token formats.
- Source audit confirmed TSC-only, non-withdrawable demo behavior and no direct-balance endpoint.

### FAIL

- None. Dependency commands that could not start after registry denial are classified as environment-blocked, not as passes or implementation failures.

### BLOCKED / NOT RUN

- BLOCKED — `pnpm install`: package registry returned `ERR_PNPM_FETCH_403`; no artificial `pnpm-lock.yaml` was created.
- BLOCKED — package registry unavailable: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:smoke`, `pnpm test:e2e`, `pnpm build`, `pnpm --filter @cg/db validate`, migration, development seed, and production-seed process verification could not load their declared executables/dependencies.
- NOT RUN — Docker unavailable in Codex environment: clean PostgreSQL migration, seed/demo-account inspection, PostgreSQL integration execution, Redis readiness execution, `docker compose config`, and `docker compose up -d --build`.
- NOT RUN — health/readiness HTTP probes: package installation was blocked, so the API could not start.
- NOT RUN — Playwright browser checks and fresh screenshot review: package installation and browser acquisition were blocked.

## Remaining known implementation gaps

None identified for the requested MASTER-01 remediation scope. Dependency-backed, database-backed, browser, build, and container checks remain mandatory before merge and may reveal defects; they are prepared in repository/CI but were not executable here.

## Active constraints

- TSC is the only asset, has no monetary value, and cannot be withdrawn.
- Real cryptocurrency, addresses, signing, custody, nodes, and real payments remain absent and forbidden.
- MASTER-02 remains prohibited until a separate MASTER-01 critic cycle and all environment-blocked gates execute successfully.

## Next step

In an environment with npm registry and Docker access: run `pnpm install` and commit the generated `pnpm-lock.yaml`; run `pnpm db:generate`; start clean PostgreSQL/Redis; run migration, development seed, `pnpm seed:verify-fail-closed`, `pnpm quality`, health/readiness probes, and Compose smoke. Review Playwright screenshots, then run `prompts/MASTER-CRITIC-LOOP.md`. Do not run MASTER-02.
