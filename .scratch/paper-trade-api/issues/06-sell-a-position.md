# 06 — Sell a Position

**What to build:** Let an Investor synchronously sell part or all of a Position, receive immediate proceeds, and retain correct weighted-average cost basis and Realized Gain or Loss.

**Blocked by:** 05 — Buy a Tradable Security

**Status:** ready-for-agent

- [ ] The Market Order endpoint accepts `side: "sell"` with the same Ticker, quantity, authentication, market-session, quote, and idempotency rules as a Buy.
- [ ] Selling an unknown Position or more shares than held returns the agreed `422` insufficient-shares error and changes no durable state.
- [ ] A partial sale removes proportional total cost basis rounded to the nearest cent and leaves the remaining quantity and basis internally consistent.
- [ ] A complete sale removes the exact remaining cost basis and removes the zero-quantity Position.
- [ ] Realized Gain or Loss equals sale proceeds minus removed cost basis and is accumulated on the Brokerage Account.
- [ ] A successful Sell atomically increases Available Cash, updates or removes the Position, updates cumulative Realized Gain or Loss, appends one immutable Sell Fill, and stores the terminal idempotency response.
- [ ] Sale proceeds are immediately available for another Market Order or Cash Withdrawal; no settlement state is introduced.
- [ ] The Sell Fill records execution price, quantity, proceeds, removed basis, realized result, canonical Ticker, and quote source timestamp without creating a separate Order.
- [ ] Idempotent replay returns the original Sell Fill, conflicting key reuse returns `409`, and concurrent sales cannot oversell the Position.
- [ ] Account reads report updated Available Cash, Positions, and cumulative Realized Gain or Loss without requiring market data.
- [ ] Account Activity returns Buy and Sell Fills alongside account opening and cash movements in newest-first order.
- [ ] Unit tests cover profitable and losing sales, partial and complete sales, basis rounding, overselling, immediate proceeds, provider failure, idempotency, and rejected-operation atomicity.
- [ ] Live-database integration tests cover the full account creation → deposit → repeated Buy → partial Sell → complete Sell → withdrawal lifecycle with Financial Datasets mocked.
- [ ] Live-database integration tests verify concurrent-sell protection and exact agreement between current state and immutable Account Activity.
- [ ] README documentation completes the Sell contract, cost-basis and Realized Gain or Loss rules, supported end-to-end workflow, and explicit exclusions.
