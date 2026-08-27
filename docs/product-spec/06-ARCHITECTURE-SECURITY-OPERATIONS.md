# 06. Архитектура, безопасность и эксплуатация

## 1. Рекомендуемые bounded contexts

Identity, Player, Compliance, Wallet, Ledger, Payments, Game Gateway, Bonus, Loyalty, Responsible Gaming, CMS, CRM, Support, Reporting, Audit.

MVP может быть modular monolith, но Ledger и Wallet должны иметь строгие границы, отдельные права БД и API. Microservices не являются целью сами по себе.

## 2. Хранилища

- PostgreSQL для транзакционных данных;
- отдельная схема/БД ledger с append-only controls;
- Redis только для cache/rate limits/locks, не как источник баланса;
- object storage для документов с malware scan и short-lived URLs;
- event bus/outbox для надёжной доставки событий;
- warehouse для BI, не для operational decisions.

## 3. Надёжность

- transactional outbox/inbox;
- idempotency и deduplication;
- state machines для KYC, deposit, withdrawal, bonus и game round;
- retry with backoff + dead-letter queue;
- circuit breakers для providers;
- no distributed transaction across provider boundary;
- disaster recovery drills;
- node/provider redundancy и independent balance verification.

## 4. Security baseline

- OWASP ASVS Level 2 минимум; усиленные требования для financial/admin flows;
- TLS, HSTS, secure cookies, CSRF, CSP, CORS allowlist;
- Argon2id/suitable managed identity для passwords;
- passkeys/phishing-resistant MFA для admins;
- secret manager, rotation, no secrets in repo/logs;
- encryption at rest для PII и backups;
- WAF/DDoS/bot protection;
- dependency/SAST/DAST/container/IaC scanning;
- SBOM и signed builds;
- branch protection, reviews, isolated CI identities;
- pentest перед production и после значимых wallet/auth изменений;
- bug bounty после стабилизации.

## 5. Transaction authorization

- авторизация привязана к конкретной операции, сумме, адресу и пользователю;
- server-side validation непосредственно перед исполнением;
- MFA token нельзя переиспользовать для другой транзакции;
- изменение адреса после подтверждения инвалидирует authorization;
- high-value действия требуют step-up и/или second approver;
- response не раскрывает чувствительные причины risk decision.

## 6. Audit log

Append-only/WORM для: auth, permissions, PII views, KYC, risk decisions, config, campaigns, adjustments, withdrawals, signing, exports и break-glass. Событие содержит actor, subject, action, before/after hashes, reason, IP/device, correlation ID, timestamp и outcome. Доступ аудитора read-only; удаление по обычной админке невозможно.

## 7. Observability

- metrics, logs, traces с correlation ID;
- исключить PII, tokens, addresses where unnecessary и секреты из logs;
- SLO/error budgets;
- алерты: ledger imbalance, negative balance attempt, confirmation lag, node divergence, hot-wallet threshold, withdrawal spike, KYC provider outage, callback duplicates, bonus budget, reconciliation break;
- synthetic checks критических read-only flows;
- dashboards для product, finance, risk и SRE.

## 8. Backup/DR

- encrypted backups и immutable copies;
- отдельный backup ledger/audit/config;
- регулярная restore verification;
- ключевой backup и wallet recovery drill без раскрытия seed разработчикам;
- documented RPO/RTO;
- regional outage and provider exit plan.

## 9. Environments/release

- dev/test/staging/prod раздельны;
- signet/testnet/regtest для разработки; реальные BTC запрещены вне prod treasury process;
- synthetic test identities, без production PII;
- feature flags и kill switches;
- migrations backward-compatible;
- canary/blue-green где применимо;
- rollback не откатывает уже совершённые ledger transactions.

## 10. Incident response

Runbooks: compromised account, wallet key suspicion, hot wallet drain, node divergence, ledger mismatch, mass promo abuse, KYC outage, provider replay, data breach, DDoS. Есть 24/7 escalation, evidence preservation, communication templates, regulator deadlines и postmortem без обвинений.
