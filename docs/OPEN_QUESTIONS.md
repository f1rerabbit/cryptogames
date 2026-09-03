# Open Questions

## Blocking real-money launch

- Exact licence and jurisdiction?
- Allowed and blocked player territories?
- Operator legal entity and required disclosures?
- Custody model and signing provider?
- KYC/AML/blockchain analytics vendors?
- Game aggregator/providers and callback specifications?
- Responsible-gaming thresholds and reporting formats?

## Not blocking Prompts 1–3

- Final brand name and logo.
- Production domain names.
- Final licensed game artwork.
- Marketing communication providers.

Codex must not invent answers. Use typed configuration and safe placeholders.

## MASTER-02 resolved interpretation — faucet versus issuance workflow

The project instruction limits TSC _issuance_ to the admin `Test Funds Grant` workflow,
while MASTER-02 explicitly requires a player demo faucet. The reversible safe implementation
treats the faucet as a transfer from the explicit `TEST_FAUCET` ledger account, never as a
second balance or real asset issuance path. It is fixed-amount, cooldown protected,
idempotent, audited, and technically absent (404 fail-closed behavior) in production mode.
