# 08. Полный чек-лист готовности

## Продукт и UX

- [ ] Регистрация, verification, login, MFA, recovery и session revoke.
- [ ] Гео/возраст/юрисдикция проверяются в критических точках.
- [ ] Профиль, история, security settings, consents.
- [ ] Лобби, search, filters, favorites, recently played, maintenance.
- [ ] Demo/real mode различимы.
- [ ] Касса показывает status, fee, confirmations и risk hold.
- [ ] Bonus center и прозрачный wagering progress.
- [ ] Support/dispute flow.
- [ ] Все legal pages, 18+ и licence disclosure.
- [ ] Responsive, localization, WCAG AA, reduced motion.

## Bitcoin и ledger

- [ ] Уникальные deposit addresses и watch-only monitoring.
- [ ] Hot/warm/cold architecture утверждена security и finance.
- [ ] Multisig/MPC/HSM и maker-checker.
- [ ] Key ceremony, backup, restore drill, rotation и succession.
- [ ] Confirmation tiers, RBF/reorg и node divergence тесты.
- [ ] Blockchain screening и held-deposit cases.
- [ ] Double-entry immutable ledger.
- [ ] Cash, bonus, reserved и pending withdrawal разделены.
- [ ] Idempotency/replay/out-of-order provider tests.
- [ ] Withdrawal address confirmation, cooldown, MFA, risk review.
- [ ] UTXO/fee/batching policy.
- [ ] Ежедневная on-chain ↔ wallet ↔ ledger ↔ provider сверка.
- [ ] Coverage/solvency dashboard и alerts.
- [ ] Запрещены реальные BTC в non-production.

## Бонусы и CRM

- [ ] Versioned templates и campaign lifecycle.
- [ ] Eligibility, budgets, caps, expiry, wagering, max bet/win.
- [ ] Promo code types, limits, brute-force и abuse controls.
- [ ] Daily claim idempotency, streak/timezone/reset policy.
- [ ] Cashback reconciliation и formula snapshot.
- [ ] Loyalty points ledger и VIP governance.
- [ ] Referral/affiliate fraud checks.
- [ ] Terms preview и отсутствие retroactive changes.
- [ ] Consent, suppression, frequency caps, quiet hours.
- [ ] Self-excluded users исключены из маркетинга и бонусов.

## Админка

- [ ] SSO, MFA, RBAC/ABAC, temporary access.
- [ ] Player 360 с PII masking.
- [ ] Нет прямого редактирования баланса.
- [ ] Financial adjustment/withdrawal/config maker-checker.
- [ ] Wallet, treasury и reconciliation dashboards.
- [ ] KYC/AML cases и evidence.
- [ ] CMS/CRM/bonus workflows draft-review-publish.
- [ ] Support console без финансовых полномочий.
- [ ] Версионирование config и rollback.
- [ ] Read-only auditor role и controlled exports.
- [ ] Break-glass process протестирован.

## Compliance и responsible gaming

- [ ] License/jurisdiction legal memo подписан.
- [ ] KYC tiers и source-of-funds rules утверждены.
- [ ] Sanctions/PEP/adverse media и ongoing screening.
- [ ] Blockchain monitoring и case escalation.
- [ ] Travel Rule решение подтверждено или обоснованно неприменимо.
- [ ] STR/SAR workflow и no-tipping-off.
- [ ] Deposit/loss/wager/time limits.
- [ ] Cooling-off и self-exclusion.
- [ ] Reality checks/activity statement.
- [ ] Vulnerability/intervention workflow.
- [ ] Marketing and affiliate compliance.
- [ ] Privacy inventory, retention, legal hold, DSR и breach plan.

## Security

- [ ] Threat models: auth, admin, ledger, wallet, provider callbacks, bonus abuse.
- [ ] OWASP ASVS baseline mapped to tests.
- [ ] Secrets manager, key rotation, least privilege.
- [ ] CSP/CSRF/CORS/cookies/TLS/rate limits.
- [ ] SAST/DAST/dependency/container/IaC scanning.
- [ ] SBOM и signed artifacts.
- [ ] External pentest закрыт; critical/high исправлены.
- [ ] WAF/DDoS/bot strategy.
- [ ] Immutable audit logs и SIEM alerts.
- [ ] Transaction authorization привязана к amount/address/action.
- [ ] No sensitive data in logs/analytics.

## Reliability и operations

- [ ] SLO, dashboards, alerts и on-call.
- [ ] Outbox/inbox, retries, DLQ и replay procedure.
- [ ] Backups encrypted; restore verified.
- [ ] RPO/RTO и disaster exercise.
- [ ] Provider outage/circuit-breaker/manual fallback.
- [ ] Kill switches для games/deposits/withdrawals/bonuses.
- [ ] Incident runbooks и regulator notification matrix.
- [ ] Capacity/load/soak/failover tests.
- [ ] Production readiness review и change freeze plan.

## Финальная приёмка

- [ ] Финансовые инварианты доказаны автоматическими property/integration tests.
- [ ] Ни один бизнес-процесс не меняет баланс вне ledger.
- [ ] Полный end-to-end путь BTC deposit → play callback → withdrawal пройден на test network.
- [ ] Reconciliation сходится после повторов, задержек, reorg и partial outage.
- [ ] Security, compliance, finance и operations дали письменный sign-off.
- [ ] Go-live limits консервативны и повышаются только после наблюдаемого периода.
