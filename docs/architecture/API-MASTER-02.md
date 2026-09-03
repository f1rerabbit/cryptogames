# MASTER-02 API inventory

All routes use `/v1`. Authentication is required unless marked public. Monetary integers are
serialized as decimal strings and the only asset is non-withdrawable, no-value `TSC`.

## Player

- `GET /me`, `GET /me/profile`, `PATCH /me/profile`
- `GET /me/wallet`, `POST /me/wallet/faucet`, `GET /me/wallet/transactions`
- `GET /games` and `GET /games/:slug` (public, active games only)
- `POST /games/:slug/sessions`
- `GET /me/game-sessions`, `GET /me/game-sessions/:id`
- `POST /game-sessions/:id/wagers`

Faucet amount is `DEMO_FAUCET_AMOUNT` (default `100000`) once per rolling 24 hours.
The API derives user identity exclusively from the opaque bearer session.

## Admin (`ADMIN` role)

- `GET /admin/players`, `GET /admin/players/:id`
- `POST /admin/players/:id/credit`, `/debit`, `/freeze`, `/unfreeze`
- `GET /admin/ledger/transactions`, `GET /admin/audit`
- `GET /admin/games`, `PATCH /admin/games/:id`
- `GET /admin/game-sessions`
- `POST /admin/wagers/:id/settle`

Credits/debits require `amount`, `reason`, `ticket`, and `idempotencyKey`. Demo money
endpoints fail closed outside `APP_MODE=demo|test`. Settlement is deterministic from the
server-generated wager ID; clients never submit a result or payout.
