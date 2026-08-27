# AGENTS.md — обязательные правила проекта

## Миссия

Создать проверяемую платформу игрового онлайн-лобби с админкой и тестовым денежным контуром. До Prompt 5 запрещены реальные криптовалюты, Bitcoin RPC, custody, приватные ключи и реальные платежи.

## Источники истины

1. Этот файл.
2. Активный мастер-промт из `prompts/`.
3. `docs/DECISIONS.md` и утверждённые ADR.
4. `docs/product-spec/`.
5. `docs/design/` и `docs/reference/lobby-reference.png`.
6. Существующий код и тесты.

При конфликте остановись, запиши конфликт в `docs/OPEN_QUESTIONS.md` и выбери наиболее безопасный обратимый вариант. Не придумывай юридические пороги.

## Режим выполнения

- Перед изменениями изучи репозиторий, `git status` и все инструкции.
- Обнови `docs/PROJECT_STATE.md`: что уже есть, что делаешь, риски и следующие шаги.
- Составь план с проверяемыми результатами, затем реализуй его полностью.
- Не оставляй псевдокод вместо работающего vertical slice.
- Не удаляй и не перезаписывай чужие изменения.
- После каждого логического блока запускай релевантные тесты.
- В конце запускай полный quality gate и фиксируй результат в `docs/PROJECT_STATE.md`.
- Делай один сфокусированный commit на мастер-промт, если Git настроен и рабочее дерево не содержит чужих незакоммиченных изменений.

## Технологический baseline

Если репозиторий пуст: pnpm workspace monorepo, TypeScript strict, Next.js web/admin, NestJS API, PostgreSQL, Redis, Prisma, Docker Compose, Vitest/Testing Library, Playwright и GitHub Actions. Используй поддерживаемые стабильные версии и зафиксируй lockfile. Если стек уже создан — не мигрируй без ADR.

## Денежные инварианты

- Все суммы — integer (`bigint`) в минимальных единицах.
- Баланс никогда не редактируется напрямую.
- Любое изменение — сбалансированная double-entry проводка.
- Ledger append-only; исправление только compensating transaction.
- Финансовая команда имеет idempotency key.
- Cash, bonus, reserved и test funds — отдельные счета.
- Нельзя получить отрицательный available balance.
- Provider callback дедуплицируется по внешнему ID.

## Тестовые деньги

- До Prompt 5 единственный актив — `TSC` (`Test Satoshi Credit`), не BTC.
- `TSC` не имеет денежной стоимости и не выводится.
- Выпуск возможен только в `APP_MODE=demo|test`, через admin workflow `Test Funds Grant`.
- Каждая выдача требует amount, reason, ticket/reference и actor; создаёт ledger transaction и audit event.
- В production режим выдачи тестовых средств технически недоступен: endpoint не регистрируется или отвечает fail-closed.
- UI постоянно показывает `DEMO • ТЕСТОВЫЕ СРЕДСТВА`.
- Нельзя называть TSC биткоином или отображать знак BTC.

## Запрет реальной криптовалюты до Prompt 5

Запрещено: генерировать seed/private keys, подключать mainnet/testnet node, создавать BTC address, принимать deposit, подписывать/broadcast transaction, устанавливать wallet SDK с signing capability. Допустимы только интерфейсы-порты без реализации, выключенные feature flag.

## Безопасность

- No secrets in Git; `.env.example` содержит только имена и безопасные значения.
- Server-side authorization для каждого admin/financial action.
- Admin: RBAC, MFA-ready interface, audit trail, deny-by-default.
- Не логировать passwords, tokens, PII documents и секреты.
- Не использовать float, `Math.random()` для денег/результатов или client-authoritative balance.
- Любой mock game/provider работает детерминированно и маркируется DEMO.

## UX и дизайн

- Референс задаёт композицию, не чужой бренд.
- Не копировать `1XGames`, постеры, персонажей или названия.
- Тема: Midnight Emerald из `docs/design/02-VISUAL-SYSTEM.md`.
- Responsive 1440/1024/768/390; WCAG 2.2 AA; keyboard и reduced motion.
- После любого существенного UI/flow этапа выполнить цикл `docs/DESIGN-QUALITY-GATE.md`.
- Критик оценивает только запущенное приложение и свежие проверенные screenshots.
- Gate: score ≥92, P0/P1 отсутствуют; P2 в финансовых, auth и permission flows отсутствуют.
- Нельзя снижать критерии, исключать неудобные страницы или обновлять visual baseline до PASS.

## Quality gate

Минимум: format/check, lint, typecheck, unit, integration, e2e smoke, production build, migration/seed validation. Если команда недоступна — добавь её. Не утверждай, что проверка прошла, если она не запускалась.

Для UI дополнительно: Playwright screenshots, visual regression, axe/эквивалент, keyboard и responsive checks. Следуй `docs/DESIGN-QUALITY-GATE.md`.

## Handoff

Финальный отчёт каждого промта:

1. результат;
2. изменённые файлы/модули;
3. миграции и seed accounts;
4. проверки с точными командами;
5. риски/заглушки;
6. следующая команда для запуска;
7. commit SHA при наличии.
