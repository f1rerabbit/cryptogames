# System context and module boundaries

The foundation is a modular monolith. `web` is the player-facing Next.js boundary, `admin` is a separately deployable staff boundary, and `api` is the only command boundary. PostgreSQL is authoritative; Redis supports readiness now and may later support cache, rate limits, and locks, but never balances.

Identity owns PostgreSQL users, Argon2id password hashes, roles, opaque-token session hashes, and revocation. Public routes are explicit; every other handler requires authentication and an explicit role policy. Audit owns immutable PostgreSQL security events. Ledger owns TSC accounts, balanced transactions, entries, persisted idempotency, and compensations. Runtime ledger commands use serializable Prisma transactions plus deterministic account row locks; no other module may calculate or mutate a balance.

`/health` reports process liveness. `/ready` fails closed unless both a PostgreSQL query and Redis PING succeed. Shared contracts contain non-secret wire vocabulary, config validates process environment during API startup, and UI owns accessible tokens/components.

External real-money, wallet, blockchain and game-provider integrations do not exist in MASTER-01.
