# 03 — Look up and quote a Tradable Security

**What to build:** Let Wealth Manager validate an exact Ticker and retrieve its current price through Paper Trade without exposing Financial Datasets credentials or provider-specific responses.

**Blocked by:** 01 — Open and inspect a Brokerage Account

**Status:** ready-for-agent

- [ ] `GET /api/securities/{ticker}` performs exact, case-insensitive lookup after trimming and normalizing the Ticker to uppercase.
- [ ] A successful lookup returns a stable Paper Trade representation of the supported US-listed stock or ETF using only fields available from Financial Datasets.
- [ ] `GET /api/securities/{ticker}/quote` returns the canonical Ticker, current `priceCents`, and provider source timestamp.
- [ ] Quote prices are positive safe integers rounded to the nearest cent.
- [ ] Unknown, inactive, unsupported, or malformed Tickers return stable Paper Trade errors rather than raw provider payloads.
- [ ] Authentication applies to both market-data endpoints and the Financial Datasets API key remains server-only.
- [ ] Provider authentication failures, timeouts, malformed responses, and unavailable service responses map to the agreed `503` market-data error without leaking upstream details.
- [ ] Security facts and quotes are fetched on demand and are not persisted, prefetched, or placed behind a new application cache.
- [ ] The Financial Datasets wrapper is the single provider boundary and can be replaced deterministically by tests without introducing a general provider abstraction.
- [ ] Unit tests at the application-service seam cover normalization, supported stock and ETF fixtures, successful quotes, unsupported Tickers, malformed provider data, and provider failures.
- [ ] The live-database integration suite remains green and confirms market-data reads create no brokerage or market-data rows.
- [ ] README documentation describes exact-Ticker lookup, current quotes, normalization, provider prerequisites, and error behavior.
