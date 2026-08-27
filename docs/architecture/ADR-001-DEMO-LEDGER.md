# ADR-001: Append-only TSC double-entry ledger

**Status:** Accepted — 2026-08-27

Use PostgreSQL integer `BIGINT` entries grouped by transaction. Every transaction has equal debit and credit totals and every command has a scoped idempotency key whose request hash is persisted. The API executes mutations in Prisma serializable transactions, locks all affected account rows in deterministic ID order, derives balances from immutable entries, and rejects any non-negative account whose post-command balance would be negative.

Entries, transactions, idempotency records, and audit events are append-only; database triggers reject update/delete. Corrections append a linked compensation whose idempotency hash includes the original transaction ID. TSC has scale zero, no monetary value, and cannot be withdrawn. Integration tests exercise real concurrent PostgreSQL connections, idempotency duplicates/collisions, insufficient funds, compensation, and database append-only triggers.
