# Codex Bitcoin Gaming Starter

Единый пакет для запуска проекта через Codex на сервере.

Начните с `START-HERE.md`. Codex автоматически прочитает корневой `AGENTS.md`; мастер-промты запускаются по порядку из `prompts/`.

## Содержимое

- `AGENTS.md` — постоянные правила для каждого запуска Codex.
- `prompts/MASTER-01..03` — три основных этапа demo MVP.
- `prompts/MASTER-CRITIC-LOOP.md` — повторяемый цикл независимой проверки и исправлений.
- `prompts/MASTER-04` — независимая проверка готовности.
- `prompts/MASTER-05..06` — отложенная Bitcoin testnet/mainnet интеграция.
- `docs/product-spec/` — полное функциональное и техническое ТЗ.
- `docs/design/` — UI/UX спецификация; корневые правила и Codex-промты имеют приоритет.
- `docs/reference/lobby-reference.png` — композиционный референс, не источник бренда/ассетов.
- `docs/DECISIONS.md`, `PROJECT_STATE.md`, `OPEN_QUESTIONS.md` — управление состоянием проекта.
- `docs/DESIGN-QUALITY-GATE.md` — измеримые критерии дизайна, UX и working UI.

## Главный safety gate

Prompts 1–4 работают только с `TSC` без реальной стоимости. Bitcoin запрещён до Prompt 5. Prompt 6 никогда не должен автоматически деплоить mainnet или обращаться к приватным ключам.

## MASTER-02 demo platform

The player surface exposes persistent profiles, a ledger-derived TSC wallet, controlled
demo faucet, catalog, game sessions and generic wagers. The admin surface provides Player
360, append-only ledger/audit views, demo adjustments, account freeze controls, catalog
operations and wager settlement. See `docs/architecture/API-MASTER-02.md` for routes.

TSC (Test Satoshi Credit) is an integer-only test asset with no monetary value and no
withdrawal path. There is no cryptocurrency, deposit, custody, key, signing, blockchain or
payment-provider implementation.

Development seed requires the safe placeholder variables documented in `.env.example`, is
repeatable, and rejects `NODE_ENV=production`. Start the stack with `docker compose up`; use
the configured demo emails and `DEMO_ACCOUNT_PASSWORD` rather than hard-coded credentials.
