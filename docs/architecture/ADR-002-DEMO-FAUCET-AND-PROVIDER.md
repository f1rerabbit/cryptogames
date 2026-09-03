# ADR-002 — Controlled demo faucet and provider simulator

## Status

Accepted for MASTER-02 demo/test environments only.

## Decision

The player faucet is an explicitly approved, narrowly scoped **DEMO issuance workflow** required
by MASTER-02. It does not mint an asset or mutate a balance: it transfers a server-configured
fixed integer amount from the explicit `TEST_FAUCET` TSC source to `PLAYER_AVAILABLE` through
the append-only double-entry ledger. The authenticated player is the actor; reference
`DEMO_FAUCET_24H`, ledger transaction, audit event, persisted claim, idempotency key and rolling
24-hour cooldown provide attribution. The endpoint fails closed outside `APP_MODE=demo|test`.
TSC has no value and remains non-withdrawable. General issuance remains exclusively the
admin preview-and-confirm `Test Funds Grant` workflow with reason and external ticket.

Demo game outcomes use a dedicated provider port and HMAC-authenticated simulator adapter.
ADMIN selects a persisted scenario fixture in demo/test; the player cannot submit it. Provider
session, round and event IDs are server-generated, callback event IDs are unique, and callback
payload hashes detect replay conflicts. Settlement and provider event persistence share the
same serializable business transaction.

## Consequences

Production exposes neither faucet nor simulator controls. Removing the faucet later is a
reversible route/policy change and does not require ledger history mutation.
