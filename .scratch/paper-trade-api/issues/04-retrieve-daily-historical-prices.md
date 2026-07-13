# 04 — Retrieve daily historical prices

**What to build:** Let Wealth Manager request daily historical OHLCV prices for an exact Ticker and date range through the stable Paper Trade market-data contract.

**Blocked by:** 03 — Look up and quote a Tradable Security

**Status:** ready-for-agent

- [ ] `GET /api/securities/{ticker}/prices` requires valid start and end dates and rejects reversed or malformed ranges with `400`.
- [ ] Ticker input follows the established exact lookup and uppercase normalization behavior.
- [ ] Successful responses contain canonical Ticker, date, open/high/low/close prices as integer cents, and provider volume where available.
- [ ] Results preserve Financial Datasets' daily end-of-day coverage without synthesizing missing dates, intraday values, adjusted values, or history outside the provider response.
- [ ] Unsupported Tickers and unavailable or malformed provider responses use the established stable error contract.
- [ ] Historical prices are fetched on demand and are not persisted, scheduled, prefetched, or placed behind a new application cache.
- [ ] Unit tests at the application-service seam cover valid ranges, date validation, price normalization and rounding, nullable volume, empty history, and provider failures, following the [Financial Datasets testing pattern](../financial-datasets-testing.md).
- [ ] The shared integration suite remains green and confirms historical-price reads do not mutate brokerage state.
- [ ] README documentation records the query parameters, daily OHLCV response, and Financial Datasets coverage limitations.
