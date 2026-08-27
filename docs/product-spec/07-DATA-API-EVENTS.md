# 07. Данные, API и события

## 1. Ключевые сущности

`Player`, `Identity`, `Consent`, `Device`, `Session`, `JurisdictionDecision`, `KycCase`, `RiskAlert`, `WalletAddress`, `OnchainTransaction`, `Utxo`, `LedgerAccount`, `LedgerTransaction`, `LedgerEntry`, `Deposit`, `Withdrawal`, `Game`, `GameSession`, `GameRound`, `ProviderTransaction`, `BonusTemplate`, `Campaign`, `BonusGrant`, `WageringProgress`, `PromoCode`, `DailyRewardClaim`, `LoyaltyAccount`, `Limit`, `Exclusion`, `SupportTicket`, `AdminAction`, `AuditEvent`, `Notification`.

## 2. Data rules

- UUID/ULID internal IDs; provider IDs хранятся отдельно;
- monetary amount = `bigint sats` + asset code;
- optimistic version/state transition guard;
- soft delete не применяется к ledger/audit;
- PII отделена логически и шифруется;
- every terms acceptance хранит document version/hash;
- policy decisions хранят input snapshot, rule/model version и reason codes.

## 3. API principles

- versioned REST/GraphQL по существующему стеку; финансовые команды предпочтительно явные REST commands;
- OAuth/OIDC для clients/admin, service identities для внутренних вызовов;
- idempotency key обязателен для deposit credit, bet, win, refund, bonus grant, adjustment, withdrawal;
- cursor pagination;
- machine-readable error code + safe message;
- rate limit per identity/device/IP/endpoint;
- ETag/version для конфликтных admin updates;
- OpenAPI и contract tests.

## 4. Основные player endpoints

```text
POST /auth/register
POST /auth/login
POST /auth/mfa/challenge
GET  /me
GET  /me/security/sessions
GET  /wallet/summary
POST /wallet/deposit-addresses
GET  /wallet/deposits
POST /wallet/withdrawals
POST /wallet/withdrawals/{id}/confirm
GET  /wallet/transactions
GET  /bonuses/offers
POST /bonuses/{id}/activate
POST /promocodes/redeem
POST /daily-rewards/claim
GET  /responsible-gaming/limits
PUT  /responsible-gaming/limits/{type}
POST /responsible-gaming/cooling-off
POST /responsible-gaming/self-exclusion
GET  /games
POST /game-sessions
```

## 5. Provider callbacks

Endpoints bet/win/refund/rollback/session-close требуют allowlist/mTLS или signed request, timestamp/nonce, replay protection, unique provider transaction ID, atomic ledger operation и deterministic response при повторе.

## 6. Domain events

- `PlayerRegistered`, `ContactVerified`, `KycStatusChanged`;
- `DepositDetected`, `DepositHeld`, `DepositCredited`, `ChainReorgDetected`;
- `WithdrawalRequested`, `WithdrawalRiskHeld`, `WithdrawalApproved`, `WithdrawalBroadcast`, `WithdrawalConfirmed`, `WithdrawalFailed`;
- `BetReserved`, `BetCommitted`, `WinCredited`, `RoundRefunded`;
- `BonusGranted`, `BonusActivated`, `WageringProgressed`, `BonusConverted`, `BonusExpired`;
- `PromoRedeemed`, `DailyRewardClaimed`, `VipTierChanged`;
- `LimitChanged`, `CoolingOffStarted`, `SelfExclusionStarted`;
- `RiskAlertCreated`, `CaseEscalated`, `AdminActionPerformed`.

Event envelope: event ID, type/version, aggregate ID/version, occurredAt UTC, correlation/causation IDs, jurisdiction, actor type, payload classification. PII не публикуется без необходимости.

## 7. Retention

Сроки не задаются универсально. Создать jurisdiction-specific retention matrix для identity/KYC, transactions, game rounds, communications, marketing consent, audit, support и deleted accounts. Legal hold перекрывает обычное удаление; доступ и уничтожение журналируются.
