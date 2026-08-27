# 04. Админка, CRM и поддержка

## 1. Общие требования

- отдельный домен/приложение;
- SSO + phishing-resistant MFA;
- IP/device policy;
- RBAC/ABAC, временное повышение прав;
- every read of sensitive profile is audited;
- PII masking и запрет bulk export по умолчанию;
- dangerous actions требуют reason, evidence и approval;
- глобальный поиск не раскрывает данные без права.

## 2. Dashboard

KPI с указанием timezone, currency basis и freshness:

- registrations, KYC funnel, FTD;
- active players, deposits, withdrawals;
- stakes, payouts, GGR/NGR;
- bonus cost/liability;
- pending withdrawal aging;
- risk/AML cases;
- wallet balances, coverage ratio, fee level;
- provider health, callback lag/errors;
- incidents and reconciliation breaks.

## 3. Player 360

- identity/contact/consents;
- country, geo history и devices;
- KYC status/documents с маскированием;
- cash/bonus balances и ledger timeline;
- deposits/withdrawals/addresses/risk results;
- game sessions/rounds;
- bonuses/promocodes/VIP;
- limits, exclusions, vulnerability markers;
- communications, tickets, notes;
- linked accounts и risk graph;
- timeline всех admin actions.

Нельзя редактировать баланс напрямую. Только adjustment workflow с проводкой.

## 4. Payments operations

- deposit monitor и confirmations;
- held deposits queue;
- withdrawal queue с risk reasons;
- fee/batch/UTXO dashboard;
- maker-checker approval;
- emergency pause отдельно для deposits, withdrawals и games;
- treasury transfers с quorum;
- reconciliation и suspense cases;
- экспорт для finance/audit.

## 5. Risk/AML cases

- rule hits и объяснимые причины;
- case owner, priority, SLA, status;
- documents/evidence/tasks/comments;
- enhanced due diligence и source of funds;
- sanctions/PEP/adverse media результаты;
- blockchain exposure и related addresses;
- decision, legal basis, reviewer;
- STR/SAR workflow по юрисдикции;
- legal hold и retention;
- запрещено раскрывать игроку факт suspicious activity report.

## 6. Bonus/CRM

- segment builder с sample size и preview;
- campaigns, promo codes, calendars, missions, VIP;
- budget/liability caps;
- approvals и four-eyes для финансовых предложений;
- templates и локализации;
- frequency caps и quiet hours;
- marketing consent и suppression list;
- A/B tests с guardrails responsible gaming;
- attribution и incremental reporting.

## 7. CMS

- lobby sections/order;
- game metadata, badges, images;
- country/device visibility;
- banners and schedules;
- legal pages/versioning;
- translations и preview;
- draft/review/publish/rollback;
- asset licensing metadata и expiry.

## 8. Support console

- тикеты, чат, attachments, canned responses;
- identity verification before sensitive disclosure;
- merge/link tickets;
- SLA, escalation, dispute category;
- read-only wallet info;
- refund/goodwill request через approval, не прямое начисление;
- incident banner и status updates;
- redaction и secure attachment scanning.

## 9. Configuration center

Версионируемые правила: jurisdictions, currencies, confirmation tiers, fees, deposit/withdraw limits, KYC thresholds, risk actions, bonus constraints, provider routing, maintenance, responsible gaming. Изменения проходят validation, peer review, effective date, canary/feature flag и rollback.

## 10. Отчётность

- regulatory reports;
- player funds/liability;
- wallet/UTXO and treasury;
- GGR/NGR and bonus cost;
- deposits/withdrawals/fees;
- KYC/AML cases and ageing;
- responsible gaming interventions;
- affiliate settlement;
- audit log export.

Каждый отчёт имеет definition, source tables, owner, refresh schedule, reconciliation status и immutable generated version.
