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
FINANCIAL_DATASETS_API_KEY=replace-with-a-provider-key
PAPER_TRADE_MARKET_ALWAYS_OPEN=false # development only
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

Unsupported HTTP methods return `405 method_not_allowed` with an `Allow` header listing the methods supported by that endpoint.

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

### Buy a Tradable Security

`POST /api/investors/{investorId}/account/market-orders` requires an `Idempotency-Key`, `side: "buy"`, a Ticker that normalizes to a supported Tradable Security, and a positive safe whole-share quantity.

```bash
curl -i -X POST http://localhost:3000/api/investors/investor-123/account/market-orders \
  -H 'Authorization: Bearer replace-with-a-shared-secret' \
  -H 'Idempotency-Key: buy-investor-123-aapl-1' \
  -H 'Content-Type: application/json' \
  -d '{"side":"buy","ticker":" aapl ","quantity":2}'
```

A successful Buy Market Order fetches a fresh quote, rounds it to cents, immediately updates Available Cash and the Position, records one immutable Fill, and returns `200`:

```json
{
  "type": "buy_fill",
  "ticker": "AAPL",
  "quantity": 2,
  "priceCents": 21134,
  "totalCents": 42268,
  "quoteTimestamp": "2026-07-13T14:30:00.000Z"
}
```

Repeated Buy Market Orders retain one Position and add integer-cent total cost basis; account reads expose its rounded weighted-average cost basis without fetching a live quote. There are no fees, spread, slippage, settlement delay, partial fills, and Market Orders are not persisted.

Market Orders are accepted Monday through Friday from 9:30 AM inclusive to 4:00 PM exclusive in `America/New_York`. Version one intentionally ignores exchange holidays and early closes. Local development may set `PAPER_TRADE_MARKET_ALWAYS_OPEN=true`; this bypasses only the session check, and production refuses to start with it enabled.

Common rejections are `400 invalid_request` for an invalid side, malformed Ticker, quantity, or missing idempotency key; `404 not_found` for an unknown Investor; `422 unsupported_ticker`; `422 market_closed`; `422 insufficient_cash`; `409 idempotency_conflict`; and `503 market_data_unavailable`. Quote failures change no financial or idempotency state. Insufficient-cash rejection creates no Fill. Replaying the same key and normalized payload returns the original Fill or terminal domain rejection without buying again.

### Sell a Position

Use the same Market Order endpoint with `side: "sell"`. The Ticker, quantity, authentication, market-session, quote, and idempotency rules are identical to a Buy.

```bash
curl -i -X POST http://localhost:3000/api/investors/investor-123/account/market-orders \
  -H 'Authorization: Bearer replace-with-a-shared-secret' \
  -H 'Idempotency-Key: sell-investor-123-aapl-1' \
  -H 'Content-Type: application/json' \
  -d '{"side":"sell","ticker":"aapl","quantity":1}'
```

A successful Sell immediately adds the proceeds to Available Cash, updates cumulative Realized Gain or Loss, updates or removes the Position, and returns its immutable Sell Fill:

```json
{
  "type": "sell_fill",
  "ticker": "AAPL",
  "quantity": 1,
  "priceCents": 25000,
  "totalCents": 25000,
  "costBasisCents": 21134,
  "realizedGainLossCents": 3866,
  "quoteTimestamp": "2026-07-13T15:30:00.000Z"
}
```

For a partial sale, `costBasisCents` is the Position's proportional total cost basis rounded to the nearest cent. A complete sale removes the exact remaining basis and the zero-quantity Position. The Fill's `totalCents` is sale proceeds, and `realizedGainLossCents` is proceeds minus removed basis. Account reads return the updated cumulative result without market data.

Selling an unknown Position or more shares than held returns `422 insufficient_shares` and changes no financial state or Account Activity. Quote failures remain retryable; domain rejections and successful Fills replay from their terminal idempotency response. Concurrent Sells are serialized so they cannot oversell.

Sale proceeds have no settlement delay and may fund the next Buy or Cash Withdrawal immediately. The supported workflow is account creation → Cash Deposit → Buy → additional Buy → partial Sell → complete Sell → Cash Withdrawal. Paper Trade does not add tax lots, short selling, fees, spread, slippage, settlement state, or persistent Orders.

## Tradable Security endpoints

Financial Datasets must be configured with a server-side API key and a subscription that includes real-time company price snapshots. Market data is fetched on demand; Paper Trade does not persist, prefetch, or cache security facts, quotes, or price history.

### Look up a Tradable Security

`GET /api/securities/{ticker}` performs an exact Ticker lookup after trimming the input and normalizing it to uppercase. It does not provide fuzzy search or aliases.

```bash
curl 'http://localhost:3000/api/securities/%20aapl%20' \
  -H 'Authorization: Bearer replace-with-a-shared-secret'
```

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NASDAQ"
}
```

Active US-listed stocks and ETFs available from Financial Datasets are supported. Unknown or inactive Tickers return `422 unsupported_ticker`; malformed Tickers return `400 invalid_request`.

### Get a current quote

```bash
curl http://localhost:3000/api/securities/aapl/quote \
  -H 'Authorization: Bearer replace-with-a-shared-secret'
```

```json
{
  "ticker": "AAPL",
  "priceCents": 21134,
  "quoteTimestamp": "2026-07-13T14:30:00.000Z"
}
```

The quote Ticker is canonical uppercase, `priceCents` is a positive safe integer rounded to the nearest cent, and `quoteTimestamp` is the provider source time normalized to ISO 8601. Provider authentication failures, timeouts, unavailable service, and malformed provider responses return `503 market_data_unavailable` without provider details.

### Get daily historical prices

`GET /api/securities/{ticker}/prices` requires inclusive `startDate` and `endDate` query parameters in `YYYY-MM-DD` format.

```bash
curl 'http://localhost:3000/api/securities/aapl/prices?startDate=2026-01-02&endDate=2026-01-05' \
  -H 'Authorization: Bearer replace-with-a-shared-secret'
```

```json
{
  "ticker": "AAPL",
  "prices": [
    {
      "date": "2026-01-02",
      "openCents": 24385,
      "highCents": 24415,
      "lowCents": 24191,
      "closeCents": 24336,
      "volume": 40230800
    }
  ]
}
```

Prices are Financial Datasets daily end-of-day OHLCV values rounded to integer cents. `volume` is `null` when unavailable. Results contain only dates returned by Financial Datasets: missing dates are not filled, and intraday, adjusted, or out-of-range history is not added. Provider coverage is limited to its supported Tickers and available history (documented as 15,000+ Tickers and roughly three or more years); an empty `prices` array is valid.

Missing, malformed, or reversed dates return `400 invalid_request`. Unsupported Tickers return `422 unsupported_ticker`; unavailable or malformed provider responses return `503 market_data_unavailable`. All Tradable Security endpoints require the Paper Trade bearer credential.

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
