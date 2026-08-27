# MASTER PROMPT 03 — Бонусы, промокоды, ежедневные награды и hardening

Работай поверх Prompt 01–02. Прочитай `AGENTS.md`, `docs/PROJECT_STATE.md`, `docs/product-spec/03-*`, `05-*`, `08-*`, текущую ledger taxonomy, API contracts и tests. Не включай криптовалюту.

## Цель

Довести demo MVP до целостной платформы: bonus engine, promocodes, daily rewards, loyalty, responsible gaming, CMS/CRM foundations, support и усиленная приёмка.

## Bonus engine

1. Versioned templates/campaigns со state machine draft → review → approved → scheduled → active → paused → ended.
2. Типы MVP: fixed TSC bonus, deposit-match simulator, cashback simulator, daily reward, promo code, manual goodwill request.
3. Отдельные ledger accounts bonus available/locked/expired/expense.
4. Eligibility: date, country placeholder, segment, KYC tier placeholder, per-user/device limits.
5. Wagering progress, contribution configuration, expiry, max conversion и clear terms snapshot.
6. Campaign budget/liability, idempotent grants, no retroactive changes.

## Promo codes и daily rewards

- single/multi/personal codes, usage limits, rate limit, normalized input и audit;
- календарь 7 дней, server-side day, одно claim/day, streak/reset/grace policy;
- deterministic rewards, никакого скрытого random mystery reward;
- multi-account/device abuse signals;
- self-excluded/cooling-off users не получают rewards.

## Admin

- campaign builder, preview, approval и pause;
- promo batch management без открытого экспорта секретных кодов всем ролям;
- daily calendar editor/versioning;
- responsible gaming limits/exclusions;
- basic KYC/risk case placeholders без фальшивой реальной проверки;
- CMS lobby ordering/banners/locales;
- support tickets и goodwill grant request через maker-checker;
- reporting по bonus liability/cost и TSC reconciliation.

## Player

- bonus center: offers/active/history/terms/progress;
- promo redemption;
- daily reward calendar;
- cash/test and bonus balances clearly separated;
- limit changes, cooling-off, self-exclusion, reality check;
- support ticket flow;
- notification center и consent settings.

## Hardening

- threat model auth/admin/ledger/bonus/provider simulator;
- rate limits, CSRF/CSP/secure cookies, safe file uploads if present;
- full audit coverage;
- accessibility review;
- load test critical ledger commands;
- backup/restore and incident runbooks;
- OpenAPI and event catalog;
- seed demo scenarios and operator manual;
- CI e2e and migration-from-zero tests.

## Финальный release gate

Запусти полный quality gate, clean bootstrap, Docker smoke и Playwright. Выполни итоговый цикл `docs/DESIGN-QUALITY-GATE.md` по всем обязательным surfaces, включая свежие screenshots, functional, visual, responsive, keyboard и accessibility evidence. Документируй известные ограничения. Создай `docs/DEMO-ACCEPTANCE.md`, отметив каждый пункт `docs/product-spec/08-ACCEPTANCE-CHECKLIST.md` как implemented, intentionally deferred или blocked с доказательством. Не называй MVP production-ready и не добавляй BTC. Обнови `docs/PROJECT_STATE.md`; commit `feat: complete bonuses compliance and demo hardening` при безопасных условиях. После этого обязателен независимый запуск `prompts/MASTER-CRITIC-LOOP.md` в новом контексте.
