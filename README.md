# Paper Trade

Paper Trade is a private, API-only Next.js service that maintains one simulated Brokerage Account per Wealth Manager Investor.

## Setup

Requirements: Node.js 20+, pnpm, and PostgreSQL (Neon is supported).

```bash
pnpm install
cp .env.local.example .env.local
pnpm db:migrate
pnpm dev
```

Configure `.env.local`:

```dotenv
DATABASE_URL=postgres://...          # pooled application connection
DATABASE_URL_UNPOOLED=postgres://... # direct migration connection (optional)
PAPER_TRADE_SERVICE_CREDENTIAL=replace-with-a-shared-secret
FINANCIAL_DATASETS_API_KEY=          # used by later market-data endpoints
```

After changing `db/schema/`, generate and apply a migration:

```bash
pnpm db:generate
pnpm db:migrate
```

## Authentication

Every endpoint requires the server-side shared credential. Send it without exposing it to browser code:

```http
Authorization: Bearer replace-with-a-shared-secret
```

Missing or invalid credentials return:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "A valid bearer credential is required."
  }
}
```

## Brokerage Account endpoints

### Create an account

`POST /api/investors/{investorId}/account` requires an `Idempotency-Key` and a non-negative safe integer amount of starting cash in cents.

```bash
curl -i -X POST http://localhost:3000/api/investors/investor-123/account \
  -H 'Authorization: Bearer replace-with-a-shared-secret' \
  -H 'Idempotency-Key: open-investor-123' \
  -H 'Content-Type: application/json' \
  -d '{"startingCashCents":1000000}'
```

A new account returns `201`:

```json
{
  "investorId": "investor-123",
  "availableCashCents": 1000000,
  "realizedGainLossCents": 0,
  "positions": []
}
```

Creation atomically records the Brokerage Account, its starting-cash Account Activity, and the response associated with the idempotency key. Retrying the same Investor, key, and payload returns the original status and body. Reusing that key with a different payload returns `409 idempotency_conflict`; using a new key after the Investor already has an account returns `409 account_already_exists`.

### Read an account

```bash
curl http://localhost:3000/api/investors/investor-123/account \
  -H 'Authorization: Bearer replace-with-a-shared-secret'
```

`GET` returns durable Available Cash, Realized Gain or Loss, and Positions without requesting market data. An unknown Investor returns `404 not_found`.

Errors use the stable shape `{ "error": { "code": string, "message": string } }`. Invalid request bodies or a missing idempotency key return `400 invalid_request`; internal database details and credentials are never returned.

### Move cash

Cash Deposits and Cash Withdrawals require an `Idempotency-Key` and a positive safe-integer `amountCents`. A successful movement returns `200` with the updated Brokerage Account and records immutable Account Activity atomically.

```bash
curl -i -X POST http://localhost:3000/api/investors/investor-123/account/deposits \
  -H 'Authorization: Bearer replace-with-a-shared-secret' \
  -H 'Idempotency-Key: deposit-investor-123-1' \
  -H 'Content-Type: application/json' \
  -d '{"amountCents":25000}'
```

```json
{
  "investorId": "investor-123",
  "availableCashCents": 1025000,
  "realizedGainLossCents": 0,
  "positions": []
}
```

Withdraw through `/withdrawals` with the same request shape:

```bash
curl -i -X POST http://localhost:3000/api/investors/investor-123/account/withdrawals \
  -H 'Authorization: Bearer replace-with-a-shared-secret' \
  -H 'Idempotency-Key: withdrawal-investor-123-1' \
  -H 'Content-Type: application/json' \
  -d '{"amountCents":30000}'
```

A Cash Withdrawal greater than Available Cash returns `422` and changes neither the account nor Account Activity:

```json
{
  "error": {
    "code": "insufficient_cash",
    "message": "Cash Withdrawal exceeds Available Cash."
  }
}
```

Zero, negative, fractional, unsafe, or malformed amounts return `400 invalid_request`; an unknown Investor returns `404 not_found`. A Cash Deposit that would make Available Cash exceed JavaScript's safe-integer range returns `422 cash_limit_exceeded`.

Retrying the same Investor, key, operation, and amount returns the original status and body. Reusing a key for a different amount or cash movement returns `409 idempotency_conflict` without moving cash again.

### List Account Activity

```bash
curl http://localhost:3000/api/investors/investor-123/account/activities \
  -H 'Authorization: Bearer replace-with-a-shared-secret'
```

`GET` returns at most 100 activities, newest first. Stable types are `starting_cash`, `cash_deposit`, `cash_withdrawal`, `buy_fill`, and `sell_fill`; Fill activities additionally expose their Ticker, quantity, integer-cent execution fields, and quote timestamp. Database identifiers and other persistence fields are not exposed.

```json
{
  "activities": [
    {
      "type": "cash_withdrawal",
      "amountCents": 30000,
      "createdAt": "2026-07-13T12:02:00.000Z"
    },
    {
      "type": "cash_deposit",
      "amountCents": 25000,
      "createdAt": "2026-07-13T12:01:00.000Z"
    },
    {
      "type": "starting_cash",
      "amountCents": 1000000,
      "createdAt": "2026-07-13T12:00:00.000Z"
    }
  ]
}
```

An unknown Investor returns `404 not_found`.

## Tests

```bash
pnpm test:unit
```

Integration tests require a dedicated database in `.env.test.local`:

```dotenv
TEST_DATABASE_URL=postgres://...          # pooled test connection
TEST_DATABASE_URL_UNPOOLED=postgres://... # optional
```

```bash
pnpm test:integration
pnpm test       # full unit and integration suite
```

Integration setup runs migrations and clears only the four application tables between tests. It aborts before cleanup when `TEST_DATABASE_URL` is missing or exactly equals `DATABASE_URL`.
