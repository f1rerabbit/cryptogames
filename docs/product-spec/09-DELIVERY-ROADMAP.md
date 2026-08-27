# 09. Рекомендуемый roadmap

## Этап 0 — юридическое и архитектурное discovery

Результаты: jurisdiction matrix, legal memo, custody/VASP decision, provider shortlist, threat model, ledger invariants, ADR wallet/keys, data classification, system context diagram, initial risk register.

## Этап 1 — фундамент

Identity, profile, RBAC, audit, configuration, CI/CD, observability, modular architecture, test environments, admin skeleton.

## Этап 2 — ledger и Bitcoin test network

Double-entry ledger, address service, watcher, confirmations, deposits, wallet tiers stub, withdrawals state machine, reconciliation, treasury dashboard. До завершения независимого security review — только regtest/signet/testnet.

## Этап 3 — compliance и responsible gaming

Jurisdiction engine, KYC, sanctions/PEP, blockchain analytics, cases, limits, cooling-off, exclusion, reporting.

## Этап 4 — platform shell и game provider integration

Лобби/CMS, session gateway, signed callbacks, round history, bet/win/refund ledger integration, provider reconciliation. Игровые движки остаются внешними/отдельными.

## Этап 5 — бонусы и CRM

Bonus engine, promo codes, daily rewards, cashback, loyalty/VIP, referrals, campaign approvals, consent/suppression.

## Этап 6 — hardening и controlled launch

Pentest, load/failover/DR, key ceremony, operational training, regulator/vendor acceptance, small treasury and user limits, invite/geo-restricted launch, 24/7 monitoring.

## Этап 7 — расширение

Увеличение лимитов после данных, новые providers, дополнительные юрисдикции, Lightning только отдельным ADR и risk assessment.

## Порядок декомпозиции для Claude

1. Создать ADR-001 `Custody and signing`.
2. ADR-002 `Double-entry ledger and account taxonomy`.
3. ADR-003 `Bitcoin deposit confirmations and reorg handling`.
4. ADR-004 `Withdrawal authorization and policy engine`.
5. ERD и ledger examples.
6. State diagrams Deposit/Withdrawal/Bonus/GameRound.
7. OpenAPI и event catalog.
8. Threat model STRIDE/abuse cases.
9. Epics → stories → acceptance tests.
10. Только после утверждения — код первого vertical slice.
