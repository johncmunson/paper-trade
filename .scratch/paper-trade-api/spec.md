# Paper Trade API

Status: ready-for-agent

## Problem Statement

Wealth Manager needs a small, dependable backend for simulated long-term investing. It must let authenticated Wealth Manager users operate one cash Brokerage Account, trade supported US-listed securities with Market Orders, inspect durable account state and Account Activity, and retrieve the limited market data needed by the application.

The current repository is an untouched create-next-app project. It has no brokerage domain, persistence, market-data integration, service authentication, API contract, or tests. Building a realistic general-purpose brokerage would be disproportionate for a take-home project, but omitting safeguards around cash, concurrency, retries, and provider failures would make even a paper-trading API unreliable.

## Solution

Build Paper Trade as an API-only Next.js service for the Wealth Manager server. Wealth Manager remains responsible for investor identity, authentication, strategy, and presentation. Paper Trade receives an opaque Investor identifier under a shared service credential and owns Brokerage Accounts, Available Cash, Positions, Fills, Realized Gain or Loss, and immutable Account Activity.

Each Investor receives one USD cash Brokerage Account with caller-specified starting cash. The service supports immediate simulated Cash Deposits and Cash Withdrawals and synchronous, all-or-nothing Buy and Sell Market Orders for positive whole-share quantities of US-listed stocks and ETFs. Orders fill at the latest Financial Datasets snapshot price rounded to the nearest cent during Paper Trade's simplified weekday market session. A development-only override can treat the market as continuously open.

Persist only account state, Positions, Account Activity, and idempotency results in Neon Postgres through Drizzle ORM. Fetch exact-Ticker security facts, current prices, and daily historical OHLCV data from Financial Datasets on demand. Use Postgres transactions and per-account row locking to prevent overspending and overselling under concurrent requests. Do not introduce cron jobs, queues, workflows, a frontend, or a general-purpose market-data mirror.

## User Stories

1. As the Wealth Manager server, I want to create a Brokerage Account for an Investor, so that the Investor can begin paper trading.
2. As the Wealth Manager server, I want to supply the account's starting cash, so that different demo Investors can begin with appropriate balances.
3. As an Investor, I want starting cash recorded as Account Activity, so that my account history explains its initial balance.
4. As the Wealth Manager server, I want duplicate account creation rejected, so that one Investor cannot accidentally receive multiple Brokerage Accounts.
5. As the Wealth Manager server, I want to address a Brokerage Account using my existing opaque Investor identifier, so that I do not need to retain another account identifier.
6. As an Investor, I want to view my Available Cash, so that I know how much I can invest or withdraw.
7. As an Investor, I want to view my Positions, so that I know which Tradable Securities I hold and in what quantities.
8. As an Investor, I want each Position to include its weighted-average cost basis, so that Wealth Manager can explain investment performance.
9. As an Investor, I want to view cumulative Realized Gain or Loss, so that I can understand the result of completed sales.
10. As the Wealth Manager server, I want account reads to remain available when Financial Datasets is unavailable, so that durable brokerage state does not depend on live market data.
11. As an Investor, I want to make a Cash Deposit, so that I can add simulated funds to my Brokerage Account.
12. As an Investor, I want a Cash Deposit to be available immediately, so that I can invest it without waiting for a simulated bank transfer.
13. As an Investor, I want to make a Cash Withdrawal, so that I can remove simulated funds from my Brokerage Account.
14. As an Investor, I want a Cash Withdrawal to be rejected when it exceeds Available Cash, so that my cash balance cannot become negative.
15. As an Investor, I want Cash Deposits and Cash Withdrawals recorded immutably, so that balance changes remain explainable.
16. As the Wealth Manager server, I want cash amounts represented as explicitly named integer-cent fields, so that neither service introduces floating-point money errors.
17. As an Investor, I want to submit a Buy Market Order using a Ticker and whole-share quantity, so that I can acquire a supported security.
18. As an Investor, I want a Buy Market Order rejected when its total cost exceeds Available Cash, so that Paper Trade does not simulate margin.
19. As an Investor, I want to submit a Sell Market Order using a Ticker and whole-share quantity, so that I can reduce or close a Position.
20. As an Investor, I want a Sell Market Order rejected when it exceeds my Position, so that Paper Trade does not simulate short selling.
21. As an Investor, I want each successful Market Order filled completely and synchronously, so that there is no pending order lifecycle to monitor.
22. As an Investor, I want sale proceeds available immediately, so that I can reinvest or withdraw without simulated settlement delays.
23. As an Investor, I want the execution price fixed to the latest usable market snapshot rounded to the nearest cent, so that every Fill is deterministic and explainable.
24. As an Investor, I want the quote source timestamp retained with my Fill, so that Wealth Manager can show when the execution price was observed.
25. As an Investor, I want trades to exclude commissions, spreads, slippage, and fees, so that the simulation remains simple.
26. As an Investor, I want purchases to update my Position's weighted-average cost basis, so that repeated buys produce one understandable basis.
27. As an Investor, I want sales to reduce weighted-average cost basis and update Realized Gain or Loss, so that completed performance is retained.
28. As an Investor, I want a Position removed after all shares are sold, so that the account reports only current holdings.
29. As an Investor, I want rejected Market Orders excluded from Account Activity, so that activity represents changes that actually occurred.
30. As the Wealth Manager server, I want a successful Market Order to return its Fill without creating a separate persistent Order resource, so that the contract matches synchronous execution.
31. As an Investor, I want Market Orders accepted only during Paper Trade's defined market session, so that normal operation approximates regular US trading hours.
32. As an operator, I want an explicit override that treats the market as always open, so that I can enable trading outside market hours in any environment.
33. As an operator, I want the always-open override honored in production, so that deployed trading hours can be configured explicitly.
34. As the Wealth Manager server, I want every state-changing request protected by an idempotency key, so that network retries cannot duplicate account creation, cash movements, or Fills.
35. As the Wealth Manager server, I want retrying the same idempotency key and payload to return the original result, so that retries are safe and predictable.
36. As the Wealth Manager server, I want reuse of an idempotency key with a different payload rejected, so that conflicting commands cannot be mistaken for retries.
37. As an Investor, I want simultaneous account mutations serialized, so that concurrent requests cannot overspend Available Cash or oversell a Position.
38. As an Investor, I want account state and Account Activity committed atomically, so that no successful response leaves partial financial state.
39. As the Wealth Manager server, I want stable machine-readable error codes, so that I can present appropriate messages and retry only transient failures.
40. As the Wealth Manager server, I want invalid requests rejected before they reach domain or persistence operations, so that malformed input cannot corrupt brokerage state.
41. As the Wealth Manager server, I want upstream and database details omitted from error responses, so that implementation details and credentials are not exposed.
42. As the Wealth Manager server, I want to look up a Tradable Security by an exact case-insensitive Ticker, so that I can validate a user-entered symbol.
43. As the Wealth Manager server, I want Tickers normalized to their canonical uppercase form, so that account and market-data records are consistent.
44. As the Wealth Manager server, I want unsupported or unavailable Tickers rejected, so that Market Orders cannot create invalid Positions.
45. As the Wealth Manager server, I want the latest price for a Tradable Security, so that Wealth Manager can display current market information.
46. As the Wealth Manager server, I want daily historical OHLCV prices for a date range, so that Wealth Manager can display long-term price history.
47. As an operator, I want market data fetched from Financial Datasets on demand, so that Paper Trade does not maintain a redundant market-data warehouse.
48. As an operator, I want a Market Order to leave account state unchanged when Financial Datasets cannot provide a usable quote, so that provider failures cannot produce unpriced trades.
49. As an operator, I want Paper Trade callable only with the shared Wealth Manager service credential, so that its public Route Handlers are not anonymously usable.
50. As an operator, I want the Financial Datasets API key and Paper Trade service credential kept server-side, so that neither secret enters a browser bundle.
51. As a maintainer, I want a small immutable Account Activity feed, so that account behavior can be diagnosed without reconstructing state from logs.
52. As a maintainer, I want a four-table persistence model, so that the take-home remains understandable and avoids speculative entities.
53. As a maintainer, I want no persisted users or identity profiles, so that Paper Trade does not duplicate Wealth Manager's ownership.
54. As a maintainer, I want no persisted market-data catalog or price history, so that storage remains limited to brokerage state.
55. As a maintainer, I want no cron jobs, queues, or workflows, so that synchronous behavior is not hidden behind unnecessary infrastructure.
56. As a reviewer, I want concise setup and API documentation with request and response examples, so that I can run and assess the project quickly.
57. As a reviewer, I want the generated frontend removed, so that the repository clearly communicates that Paper Trade is an API service.
58. As a developer, I want unit tests with mocked database and Financial Datasets boundaries, so that orchestration and domain behavior can be checked quickly.
59. As a developer, I want integration tests against a live isolated Neon test database, so that Drizzle queries, constraints, transactions, and locking are verified realistically.
60. As a developer, I want Financial Datasets mocked in integration tests, so that tests remain deterministic and do not consume API quota.
61. As an operator, I want tests to refuse unsafe database configuration, so that they cannot erase development or production data.
62. As a future maintainer, I want the design to permit HTTP-level end-to-end tests later, so that actual Route Handler behavior can be covered when it becomes valuable.

## Implementation Decisions

- Use TypeScript, Next.js App Router Route Handlers, Drizzle ORM, Neon Postgres, and Financial Datasets. The service runs in the Node.js runtime.
- Remove the generated frontend and public assets. The repository is API-only; documentation lives in the README rather than a landing page or API explorer.
- Treat Paper Trade as a private server-to-server API. Wealth Manager owns Investor authentication and sends an opaque Investor identifier with a shared bearer credential. Paper Trade stores no user profile or authentication session.
- Expose one thin HTTP adapter over one primary application-service seam. Route Handlers authenticate, parse and validate HTTP input, invoke the application service, and map its results to HTTP responses. Brokerage behavior must not live in Route Handlers.
- The application-service seam exposes the agreed operations: create/read a Brokerage Account, deposit, withdraw, submit a Market Order, list Account Activity, look up a Tradable Security, get a current price, and get daily historical prices.
- Expose those operations through `POST /api/investors/{investorId}/account`, `GET /api/investors/{investorId}/account`, `POST /api/investors/{investorId}/account/deposits`, `POST /api/investors/{investorId}/account/withdrawals`, `POST /api/investors/{investorId}/account/market-orders`, and `GET /api/investors/{investorId}/account/activities`.
- Expose market data through `GET /api/securities/{ticker}`, `GET /api/securities/{ticker}/quote`, and `GET /api/securities/{ticker}/prices` with required start and end dates.
- Account creation accepts `startingCashCents`. Cash movements accept `amountCents`. Market Orders accept `side`, `ticker`, and `quantity`. The account response includes Investor identifier, Available Cash, cumulative Realized Gain or Loss, and Positions with quantity and cost basis. All response money and price fields use integer cents.
- Address a Brokerage Account by Wealth Manager's opaque Investor identifier. Do not expose a second account identifier. Each Investor may have exactly one Brokerage Account.
- Require caller-specified, non-negative `startingCashCents` when creating an account. Record account opening and starting cash as immutable Account Activity. Duplicate creation returns a conflict.
- Do not expose account closure, deletion, or reset. Local development may reset the database directly.
- Support USD only. Every API field representing cash, price, basis, proceeds, or gain/loss uses a safe integer number of cents with a name ending in `Cents`.
- Cash Deposits and Cash Withdrawals are positive integer-cent amounts that apply immediately. A withdrawal greater than Available Cash is rejected.
- Support only Buy and Sell Market Orders for a positive whole-share quantity. Reject fractional quantities, dollar-denominated orders, insufficient-cash buys, and sells greater than the current Position.
- A successful Market Order creates one Fill and no separate persistent Order. A rejected Market Order creates no Account Activity. There are no pending, partial, cancelled, or expired states.
- Fetch a fresh Financial Datasets company price snapshot before attempting a Fill. Validate that the returned price is positive and usable, round it to the nearest cent, and retain the provider timestamp with the Fill. A missing, malformed, or failed quote returns a market-data error and performs no account mutation.
- Apply no commissions, spread, slippage, or fees. Fills update cash and Positions immediately; sale proceeds have no settlement delay.
- Store each Position's whole-share quantity and total cost basis in cents. Derive weighted-average cost from total basis and quantity. For a partial sale, remove a proportional basis rounded to the nearest cent; for a complete sale, remove the exact remaining basis. Realized Gain or Loss equals sale proceeds minus removed basis.
- Return durable account state without live quotes: Available Cash, current Positions and their weighted-average basis, and cumulative Realized Gain or Loss. Wealth Manager obtains current prices separately when it needs display valuation.
- Persist four tables only: accounts, positions, account activities, and idempotency keys.
- The accounts table is keyed by Investor identifier and stores Available Cash and cumulative Realized Gain or Loss.
- The positions table is uniquely keyed by Investor identifier and Ticker and stores whole-share quantity and total cost basis.
- The account activities table is immutable and represents account opening/starting cash, Cash Deposits, Cash Withdrawals, and Buy or Sell Fills. Fill activity includes Ticker, quantity, execution price, proceeds or cost, quote timestamp, and realized result where applicable.
- The idempotency table stores the request key, a canonical request fingerprint, response status, and response body. Scope keys to the affected Investor. The same key and payload returns the original result; the same key with a different payload returns a conflict.
- Require an `Idempotency-Key` header for account creation, Cash Deposits, Cash Withdrawals, and Market Orders. Authentication failures and malformed requests are rejected before mutation handling.
- For each cash movement or Market Order, execute idempotency handling, account-row locking, invariant re-checking, current-state updates, Account Activity insertion, and terminal idempotency response storage atomically in Postgres.
- Fetch external market data before taking an account row lock so that network latency does not extend the lock. Re-check all cash and Position invariants after acquiring the lock.
- Rely on the account uniqueness constraint for concurrent account creation. Rely on a uniqueness constraint for concurrent reuse of the same idempotency key.
- Normalize all Ticker input by trimming and uppercasing it. Do not maintain aliases or fuzzy matches.
- Define a Tradable Security as a currently available US-listed stock or ETF supported by the selected Financial Datasets endpoints. Bond exposure is available only through listed bond ETFs.
- Fetch security facts, current snapshots, and daily historical OHLCV prices on demand. Normalize provider responses to Paper Trade's contract, including integer-cent prices. Do not persist or prefetch market data.
- Restrict historical prices to the provider's daily end-of-day coverage and supported date range. Do not synthesize intraday data or extend missing history.
- Treat the market as open Monday through Friday during the half-open interval from 9:30 AM through 4:00 PM America/New_York. Version one intentionally ignores exchange holidays and early closes.
- Support a server-only `PAPER_TRADE_MARKET_ALWAYS_OPEN=true` override in every environment. It bypasses only the market-session check; quote, account, cash, Position, and validation rules still apply.
- Use a server-only Financial Datasets API key, database connection string, and Paper Trade service credential. Do not use `NEXT_PUBLIC_` configuration for secrets.
- Return errors as `{ "error": { "code": string, "message": string } }`. Use `400` for invalid input, `401` for an invalid service credential, `404` for missing resources, `409` for duplicate resources or idempotency conflicts, `422` for rejected domain actions, and `503` for unavailable market data. Do not return upstream payloads, stack traces, SQL, or secret values.
- Use stable domain-specific codes including invalid request, unauthorized, not found, account already exists, idempotency conflict, market closed, insufficient cash, insufficient shares, unsupported Ticker, and market data unavailable.
- Keep Account Activity reads bounded and ordered newest first. A simple bounded pagination mechanism is sufficient; no activity projections or analytics are required.
- Do not add cron schedules, queues, workflows, webhooks, caches, a local market-data catalog, or background consumers. Every agreed operation is synchronous.
- Document environment setup, migrations, authentication, idempotency, development market override, endpoint behavior, payloads, responses, error codes, and representative requests in the README. Do not add OpenAPI generation, Swagger UI, or a client SDK.
- Use the current domain glossary vocabulary and preserve the existing ADR decisions concerning tradable securities, the private service boundary, corporate actions, and the simplified market calendar.

## Testing Decisions

- Use Vitest in the Node environment.
- Use one primary test seam: the application service called by Route Handlers. Both unit and integration tests invoke the same public operations at this seam. This is the highest useful seam before HTTP and avoids creating separate test-only interfaces.
- Keep the database and Financial Datasets wrapper as replaceable dependencies at that seam. Do not add factories, class hierarchies, or one-implementation interfaces solely for tests; module-level dependencies or small function dependencies are sufficient.
- Good tests assert externally visible results and durable state: returned account data, errors, Account Activity, balances, Positions, Realized Gain or Loss, and idempotent behavior. They must not assert Drizzle query chains, internal helper calls, SQL statement shape, or private function ordering.
- Unit tests use a mocked database boundary and mocked Financial Datasets boundary. They cover orchestration and domain outcomes without a network or live database.
- Unit tests cover account creation, duplicate creation, deposits, excessive withdrawals, Buy and Sell Fills, insufficient cash, insufficient shares, complete and partial Position sales, weighted-average basis rounding, immediate proceeds, market-closed rejection, the always-open override, provider failure, Ticker normalization, malformed provider data, and error mapping.
- Unit tests cover idempotency replay, conflicting payload reuse, and the rule that rejected operations do not create Account Activity.
- Unit tests control the clock explicitly when testing market sessions; they must not depend on the machine's timezone or current date.
- Integration tests use a live, dedicated Neon test database and a mocked Financial Datasets boundary. They verify actual Drizzle mappings, schema constraints, transactions, row locks, immutable Account Activity, and idempotency uniqueness.
- The primary integration flow covers account creation, Cash Deposit, Buy Fill, additional Buy Fill, partial Sell Fill, Cash Withdrawal, account read, and Account Activity read.
- Integration tests additionally cover duplicate account creation, retrying an idempotent write, conflicting idempotency reuse, insufficient-cash rollback, insufficient-shares rollback, and two concurrent mutations that cannot both satisfy the same account balance or Position.
- Require `TEST_DATABASE_URL`. Test startup fails if it is absent or equal to `DATABASE_URL`. Never fall back to development or production database configuration.
- Load test environment variables explicitly for Vitest without using a `VITE_` prefix for secrets. Use an ignored local test environment file or an injected process environment.
- Run migrations against the test database before integration tests and clean the four application tables between tests. Integration tests that share database state run serially.
- Financial Datasets is never called live by automated unit or integration tests. Deterministic fixtures represent successful stock/ETF lookup, quotes, historical prices, unavailable Tickers, malformed responses, and provider failures. Follow the [Financial Datasets testing pattern](financial-datasets-testing.md).
- There is no existing testing prior art in the repository because it is still create-next-app boilerplate. The test organization should therefore remain minimal rather than introducing multiple harnesses.
- HTTP-level end-to-end tests are a future third layer. They may start a real Next.js server and use a live test database while still replacing Financial Datasets with a deterministic fake endpoint. They are not required by this spec.

## Out of Scope

- Any Wealth Manager frontend, landing page, visual component, browser test, or API explorer.
- End-user registration, login, sessions, authorization roles, profiles, or duplicated identity data.
- A public or reusable multi-client brokerage platform.
- Multiple Brokerage Accounts per Investor, joint accounts, account closure, deletion, reset, or transfer between accounts.
- Real banking, linked bank accounts, ACH, pending transfers, transfer failures, transfer fees, or settlement lifecycles.
- Non-USD currencies or foreign exchange.
- Individual bonds; bond exposure is limited to listed bond ETFs.
- Crypto, options, futures, real estate, IPOs, margin, short selling, or non-US markets.
- Fractional shares and dollar-denominated orders.
- Limit, stop, stop-limit, recurring, scheduled, or extended-hours orders.
- Persistent Orders, pending orders, cancellation, expiration, partial fills, order routing, or exchange simulation.
- T+1 settlement, settled/unsettled cash, trading violations, or buying-power rules beyond Available Cash.
- Bid/ask spreads, slippage, commissions, fees, and market impact.
- Tax lots, FIFO/LIFO selection, wash sales, taxable-gain reporting, statements, or tax documents.
- Dividends, splits, mergers, spin-offs, ticker changes, delistings, and other corporate actions.
- Accurate exchange holidays, early closes, halts, auctions, or a production-grade market calendar.
- Live account valuation, unrealized-gain aggregation, strategy management, allocation targets, rebalancing, recommendations, watchlists, alerts, or notifications.
- Company-name search, fuzzy search, autocomplete, aliases, or a synchronized security master.
- Persisted or scheduled market-data ingestion, market-data warehousing, quote caching, or provider failover.
- Financial statements, metrics, news, SEC filings, earnings, insider data, fund constituents, or other Financial Datasets capabilities beyond exact security lookup, current price, and daily historical OHLCV.
- Cron schedules, Vercel Queues, Workflow DevKit, webhooks, or other asynchronous orchestration.
- OpenAPI generation, Swagger UI, generated clients, or SDK publication.
- HTTP-level end-to-end tests in the initial implementation.

## Further Notes

- The repository currently contains only create-next-app boilerplate and project guidance. There is no existing application architecture or test suite to preserve.
- The domain vocabulary is recorded in `CONTEXT.md`. Architectural constraints are recorded in four ADRs covering exchange-listed securities, the private Wealth Manager boundary, excluded corporate actions, and the simplified market calendar.
- Financial Datasets' real-time snapshot endpoint requires an active subscription. Local and deployed environments need an appropriate server-side API key.
- Financial Datasets documents real-time coverage for actively traded US stocks and daily historical OHLCV coverage for 15,000+ Tickers over roughly three or more years. The implementation must not promise broader history or instrument coverage than the provider returns.
- The intentionally simplified calendar and excluded corporate actions make this suitable for the take-home simulation, not a production brokerage or long-running source of record.
