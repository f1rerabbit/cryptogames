# Local and server runbook

## Local bootstrap

1. `cp .env.example .env` and set local `SESSION_SECRET` and `DEMO_ACCOUNT_PASSWORD`; never commit them.
2. `pnpm install --frozen-lockfile`
3. `pnpm db:generate`
4. `docker compose up -d postgres redis`
5. `NODE_ENV=development pnpm migrate && NODE_ENV=development pnpm seed`
6. Export `TEST_DATABASE_URL` to a disposable migrated PostgreSQL database before integration tests.
7. `pnpm dev` (web `:3000`, API `:3001`, admin `:3002`).
8. Check `curl -fsS http://localhost:3001/v1/health` and `curl -fsS http://localhost:3001/v1/ready`.

`/health` is process liveness. `/ready` returns non-ready unless PostgreSQL and Redis both respond. Demo identities are configured by `DEMO_PLAYER_EMAIL` and `DEMO_ADMIN_EMAIL`; both use runtime-only `DEMO_ACCOUNT_PASSWORD`.

## Verification

Run `pnpm quality` with a migrated disposable `TEST_DATABASE_URL`. Install Chromium once with `pnpm exec playwright install chromium`. Playwright starts player/admin servers, checks desktop and 390 px mobile layouts, axe accessibility, keyboard navigation, and writes screenshots beneath `test-results/playwright`.

Verify production seed rejection with `pnpm seed:verify-fail-closed`. Clean-database verification is `NODE_ENV=development pnpm migrate && NODE_ENV=development pnpm seed`; inspect accounts only through Prisma/admin tooling without printing password hashes.

## Server

Use a non-root service identity, external TLS reverse proxy, secret manager, and non-public backend network. Replace example credentials, restrict CORS origins, run migrations as a one-shot release task, then deploy immutable images. PostgreSQL and Redis have no host ports in Compose. Back up PostgreSQL and test restore before promotion. Never seed production; the seed rejects every mode other than `development` and `test`.

## Recovery

Stop command traffic, preserve logs/correlation IDs, compare balanced ledger totals, restore to an isolated database, and replay only commands whose scoped idempotency records are absent. Never repair history with SQL update; append a compensating transaction after approval.
