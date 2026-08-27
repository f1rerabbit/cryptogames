# MASTER PROMPT 02 — Player platform, admin и тестовые деньги

Работай поверх результата Prompt 01. Сначала прочитай `AGENTS.md`, `docs/PROJECT_STATE.md`, git history/status, `docs/design/`, визуальный референс, `docs/product-spec/01-*`, `02-*` только в части ledger, `04-*` и `07-*`. Проверь текущие tests. Затем реализуй задачу полностью.

## Цель

Создать полноценный демонстрационный vertical slice: администратор выдаёт TSC, игрок видит средства, запускает deterministic mock game session, система проводит bet/win/refund через ledger, всё видно в админке и аудите.

## Player web

1. Оригинальный responsive lobby по Midnight Emerald и референсу композиции.
2. Header: бренд-заглушка, TSC balance, profile, responsible-gaming link.
3. Search/categories/favorites/recent.
4. Локальные оригинальные placeholder covers без копирования чужого бренда.
5. Game cards и preview modal с постоянной маркировкой DEMO.
6. Profile: security sessions, transaction history, bonus/cash separation, limits.
7. Empty/loading/error/unavailable states, keyboard, focus, reduced motion.

## Provider simulator

1. Отдельный adapter/module, имитирующий стороннего game provider.
2. Не создавать настоящую азартную игру. Сделать deterministic scenario harness с заранее заданными сценариями `LOSS`, `WIN_SMALL`, `WIN_LARGE`, `REFUND` доступными только test/admin configuration.
3. Server-authoritative session and round IDs.
4. Signed/replay-protected internal callbacks либо эквивалент для simulator.
5. Bet reserve/commit, win credit, refund/rollback с idempotency и out-of-order tests.
6. Игрок не выбирает результат; scenario задаётся seed fixture/test admin до запуска.

## Admin web

1. Dashboard: users, TSC liabilities, grants, bets/wins/refunds, audit events.
2. Player 360: identity summary, status, balances, ledger timeline, sessions, audit.
3. `Test Funds Grant`:
   - только ADMIN/FINANCE в demo/test;
   - player, amount, reason, external ticket/reference;
   - preview сбалансированных entries;
   - подтверждение;
   - idempotency;
   - audit event;
   - configurable per-grant/day limits;
   - невозможно в production mode.
4. Отдельный `Revoke/Correct` только compensating transaction, без delete/edit.
5. Game simulator control только ADMIN в non-production.
6. Audit viewer с фильтрами.
7. RBAC management без возможности снять защиту последнего super admin.

## Demo money accounting

- Treasury test issuance account → player TSC available.
- Bet: player available → game clearing.
- Win: game clearing/house test expense → player available по утверждённой taxonomy.
- Refund: compensating entries.
- Dashboard liabilities вычисляются из ledger, не из mutable balance column.

## UX безопасность

- На каждой странице player/admin видимый `DEMO / TEST FUNDS / NO REAL VALUE`.
- TSC нельзя вывести, обменять или показать как BTC.
- Deposit/withdraw routes отсутствуют или показывают disabled future feature без формы адреса.

## Проверка

Добавь unit/integration/e2e tests всего vertical slice, включая unauthorized grant, production fail-closed, duplicate callback, concurrency, refund и audit. Выполни полный цикл `docs/DESIGN-QUALITY-GATE.md` на surfaces Prompt 02: свежие screenshots 1440/1024/768/390, findings, исправления и повторная проверка до PASS либо объективного blocker. Запусти quality gate и production builds, обнови `docs/PROJECT_STATE.md`, создай commit `feat: add demo lobby admin and test funds ledger` при безопасных условиях. Рекомендуй отдельный свежий запуск `prompts/MASTER-CRITIC-LOOP.md`.
