# MASTER PROMPT 01 — Foundation

Ты работаешь в корне нового репозитория. Прочитай полностью `AGENTS.md`, `START-HERE.md`, `docs/DECISIONS.md`, `docs/PROJECT_STATE.md`, все файлы `docs/product-spec/00-*`, `06-*`, `07-*`, `08-*`, а также список остальных спецификаций. Затем выполни задачу автономно до рабочего результата.

## Цель

Создать качественный фундамент monorepo для игровой платформы без реальной криптовалюты и без настоящих игр.

## Реализуй

1. pnpm workspace monorepo:
   - `apps/web` — Next.js player app;
   - `apps/admin` — Next.js admin app;
   - `apps/api` — NestJS API;
   - `packages/db`, `packages/contracts`, `packages/config`, `packages/ui`, `packages/test-utils`.
2. PostgreSQL + Redis через Docker Compose, healthchecks, persistent dev volumes без публикации DB/Redis наружу.
3. TypeScript strict, ESLint, formatter, env validation и `.env.example`.
4. Prisma schema и миграции для users, roles, sessions, consents, audit events, feature flags и базового demo ledger:
   - assets;
   - ledger accounts;
   - ledger transactions;
   - ledger entries;
   - idempotency records.
5. Append-only double-entry ledger service для `TSC` с проверкой debit=credit, запретом отрицательного available balance и compensating transactions.
6. Auth для demo: email/password, secure password hashing, server sessions/JWT согласно выбранной архитектуре; роли PLAYER, SUPPORT, FINANCE, RISK, CONTENT, ADMIN, AUDITOR.
7. Seed только для development/test с документированными demo accounts; пароль берётся из env, не коммитится.
8. API health/readiness, structured safe logging, correlation IDs, global validation/error format.
9. Audit middleware/service для auth, admin и ledger actions.
10. Web/admin skeleton routes и общий design-token package, пока без полной витрины.
11. GitHub Actions: install, lint, typecheck, unit/integration tests, build.
12. Scripts: bootstrap, migrate, seed, test, quality, dev, build.
13. Architecture docs:
    - system context;
    - module boundaries;
    - ADR demo ledger;
    - ERD;
    - local/server runbook.

## Тесты

- property/integration tests ledger balance;
- concurrent debit не создаёт отрицательный баланс;
- duplicate idempotency key не создаёт вторую проводку;
- compensating transaction сохраняет историю;
- RBAC deny-by-default;
- clean database migrate + seed;
- web/admin/API smoke.

## Жёсткие ограничения

- Только `TSC`; никаких BTC addresses, RPC, wallet SDK, blockchain packages или private keys.
- Не создавай endpoint прямой установки баланса.
- Не используй SQLite вместо PostgreSQL.
- Не оставляй финансовые TODO без безопасной блокировки.
- Если объём велик, сначала заверши работающий вертикальный фундамент и тесты, затем улучшай документацию; не распыляйся на декоративные функции.

## Завершение

Запусти полный quality gate и Docker smoke. Для созданных web/admin surfaces выполни применимую часть `docs/DESIGN-QUALITY-GATE.md`; сохрани evidence. Обнови `docs/PROJECT_STATE.md`. Если Git чист до начала и настроен, создай commit `feat: establish secure demo platform foundation`. В финале дай точные команды запуска и учётные записи только как ссылки на env variables, без вывода секретов. Рекомендуй следующим запуском `prompts/MASTER-CRITIC-LOOP.md`.
