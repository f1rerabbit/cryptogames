# 00. Общие требования

## 1. Цели

- дать совершеннолетнему разрешённому пользователю безопасно зарегистрироваться, пройти проверки, внести BTC, получить доступ к разрешённым играм и вывести доступный выигрыш;
- обеспечить оператору полный контроль финансов, рисков, контента, бонусов, пользователей и регуляторной отчётности;
- исключить изменение баланса вне проводок double-entry ledger;
- обеспечить доказуемый audit trail всех действий пользователя и сотрудников.

## 2. Роли

| Роль | Возможности |
| --- | --- |
| Гость | просмотр разрешённого публичного контента, регистрация, legal pages |
| Игрок | профиль, KYC, депозит, игры, бонусы, вывод, лимиты, поддержка |
| Support L1 | просмотр профиля с маскированием, тикеты, без финансовых изменений |
| Support L2 | расширенное расследование, но без самостоятельного вывода средств |
| Risk/AML | проверки, кейсы, source of funds, ограничения и отчёты |
| Finance | сверка, treasury, комиссии, выводы в пределах policy |
| Content/CRM | баннеры, сегменты, коммуникации, бонусные кампании |
| Compliance | правила юрисдикций, отчётность, legal holds |
| Security | доступы, инциденты, журналы, ключевые политики |
| Super Admin | конфигурация; не имеет единоличного доступа к приватным ключам |
| Auditor | read-only экспорт и проверка журналов |

## 3. Принципы доступа

- `GEN-001`: RBAC + при необходимости ABAC по юрисдикции, сумме и риску.
- `GEN-002`: least privilege и deny-by-default.
- `GEN-003`: действия с деньгами требуют maker-checker; инициатор не утверждает своё действие.
- `GEN-004`: production-доступ сотрудников только с MFA, managed device/VPN или zero-trust gateway.
- `GEN-005`: impersonation игрока запрещена; допустим read-only support view с баннером и аудитом.
- `GEN-006`: PII и секретные финансовые данные маскируются по роли.

## 4. Системные модули

1. Identity & Access.
2. Player Profile.
3. Jurisdiction & Eligibility.
4. KYC/AML/Risk.
5. Wallet Gateway.
6. Double-entry Ledger.
7. Payments/Withdrawals.
8. Game Aggregation Gateway.
9. Bonus & Promotion Engine.
10. Loyalty/VIP.
11. Responsible Gaming.
12. CMS/Lobby.
13. CRM/Notifications.
14. Support/Case Management.
15. Admin Portal.
16. Reporting/Data Platform.
17. Audit/Security/Observability.

## 5. Нефункциональные требования

- `NFR-001`: денежные значения — integer satoshi, без float.
- `NFR-002`: финансовые команды идемпотентны и имеют idempotency key.
- `NFR-003`: ledger — append-only; исправления только компенсирующими проводками.
- `NFR-004`: все timestamps хранятся в UTC; UI локализует часовой пояс.
- `NFR-005`: целевая доступность player API 99.95%; wallet/ledger 99.99% после стабилизации.
- `NFR-006`: p95 чтения лобби <300 ms без учёта CDN; p95 нефинансовой команды <800 ms.
- `NFR-007`: RPO ledger стремится к 0; RTO критического финансового контура ≤60 минут.
- `NFR-008`: полная трассировка команды по correlation ID.
- `NFR-009`: локализация текстов, валютного представления, legal pages и времени.
- `NFR-010`: WCAG 2.2 AA для основных пользовательских потоков.
- `NFR-011`: конфигурация юрисдикций и лимитов версионируется с effective date.

## 6. Внешние зависимости

- Bitcoin full node(s) или проверенный infrastructure provider;
- custody/HSM/MPC/multisig;
- blockchain analytics;
- KYC/identity verification;
- sanctions/PEP/adverse media;
- email/SMS/push;
- geo-IP + device intelligence;
- game aggregator/provider;
- support/helpdesk при внешней интеграции;
- BI/data warehouse.

Каждая зависимость должна иметь adapter, timeout, retry policy, circuit breaker, webhook signature verification, sandbox и manual fallback.

## 7. Definition of Done функции

Функция считается готовой, когда есть: утверждённые требования, UX-состояния, threat model, права доступа, миграции, API/schema, unit/integration/e2e тесты, audit events, метрики и алерты, runbook, rollback/feature flag, документация support/admin и подтверждение compliance для затронутых стран.
