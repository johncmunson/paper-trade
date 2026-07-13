# 05 — Buy a Tradable Security

**What to build:** Let an Investor synchronously buy a positive whole-share quantity of a Tradable Security at the current quoted price while preserving cash, Position, Fill, idempotency, and concurrency invariants.

**Blocked by:** 02 — Move cash and list Account Activity; 03 — Look up and quote a Tradable Security

**Status:** resolved

- [ ] `POST /api/investors/{investorId}/account/market-orders` accepts `side: "buy"`, a normalized Ticker, and a positive safe whole-share `quantity`, and requires an idempotency key.
- [ ] Buy Market Orders are accepted only Monday through Friday from 9:30 AM inclusive to 4:00 PM exclusive in `America/New_York`.
- [ ] The simplified market session intentionally ignores exchange holidays and early closes and is tested independently of the machine timezone.
- [ ] `PAPER_TRADE_MARKET_ALWAYS_OPEN=true` bypasses only the market-session check in every environment.
- [ ] A Buy fetches a fresh current quote before locking the Brokerage Account, rounds the quote to `priceCents`, and retains the quote timestamp.
- [ ] A missing or unusable quote returns `503` and leaves cash, Positions, Account Activity, and idempotent financial state unchanged.
- [ ] After taking the account lock, the service re-checks that total cost does not exceed Available Cash; insufficient cash returns the agreed `422` error with no Fill.
- [ ] A successful Buy atomically decreases Available Cash, creates or updates the Position's quantity and total cost basis, appends one immutable Buy Fill to Account Activity, and stores the terminal idempotency response.
- [ ] Repeated purchases update weighted-average basis through total cost basis without floating-point money arithmetic.
- [ ] The Fill records whole-share quantity, execution price, total cost, canonical Ticker, and quote source timestamp, with no fee, spread, slippage, or settlement delay.
- [ ] No separate persistent Order is created, and rejected requests create no Account Activity.
- [ ] Idempotent replay returns the original Fill; conflicting key reuse returns `409` without another purchase.
- [ ] Two concurrent Buy requests cannot both spend the same Available Cash, and the losing request receives a domain rejection rather than corrupting state.
- [ ] Account reads show the resulting Position and cost basis without fetching a live quote; Account Activity includes the Buy Fill.
- [ ] Unit tests cover market hours, the always-open override, quote failures, validation, insufficient cash, first and repeated purchases, idempotency, and atomic rejection.
- [ ] Live-database integration tests verify a complete Buy flow, Position uniqueness, transaction rollback, idempotency uniqueness, and concurrent-buy protection with Financial Datasets mocked according to the [Financial Datasets testing pattern](../financial-datasets-testing.md).
- [ ] README documentation describes Buy Market Orders, session behavior, the always-open override, Fill fields, and common rejections.
