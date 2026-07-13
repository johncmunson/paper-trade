---
name: financial-datasets
description: Use when you need to read the documentation for the Financial Datasets API and understand how to use it.
---

# Financial Datasets

> Financial Datasets is a stock market API with financial data for 27,000+ tickers over 30+ years, including financial statements, equity prices, insider transactions, SEC filings, and more.

## Docs

- [Activist Ownership](references/01.activist-ownership.md): Track activist investor stakes from SEC Schedule 13D filings in real time. See who is building a position with intent to influence control.
- [Beneficial Ownership](references/02.beneficial-ownership.md): See every holder of more than 5% of a US public company, from SEC Schedules 13D and 13G. Activist and passive stakes with full amendment history.
- [Facts (by CIK)](references/03.facts-by-cik.md): Get company information and facts by SEC CIK number. Includes sector, industry, market cap, and corporate details.
- [Facts (by ticker)](references/04.facts-by-ticker.md): Get company information and facts by stock ticker. Includes sector, industry, market cap, employee count, and more.
- [Company Earnings](references/05.company-earnings.md): Get quarterly and annual earnings data for a single company. Includes EPS actuals, estimates, surprise, and report dates.
- [Earnings Feed](references/06.earnings-feed.md): A real-time feed of the most recently filed earnings across all covered companies.
- [Items](references/07.filing-items.md): Get specific sections and items from SEC filings, like Item 1A Risk Factors or Item 7 MD&A.
- [Filings](references/08.filings.md): Search SEC filings (10-K, 10-Q, 8-K) for any US public company by stock ticker.
- [Historical](references/09.financial-metrics-historical.md): Get historical financial metrics and ratios for any US stock ticker. Includes P/E, EV/EBITDA, ROE, and 100+ metrics.
- [Snapshot](references/10.financial-metrics-snapshot.md): Get a real-time snapshot of current financial metrics and valuation ratios for any US stock ticker.
- [All Financial Statements](references/11.all-financial-statements.md): Get all financial statements (income, balance sheet, cash flow) for any US stock in a single API call.
- [All Segmented Financials](references/12.all-segmented-financials.md): Get all segment breakdowns (income statement, balance sheet, cash flow) for any US stock in a single API call.
- [Balance Sheet](references/13.balance-sheet-segments.md): Get balance sheet segment breakdowns (assets, goodwill, long-lived assets) by business segment for any US public company.
- [Balance Sheets](references/14.balance-sheets.md): Get balance sheet data for any US stock ticker. Assets, liabilities, and equity with 30+ years of history.
- [Cash Flow Statement](references/15.cash-flow-statement-segments.md): Get cash flow statement segment breakdowns (capital expenditure) by business segment for any US public company.
- [Cash Flow Statements](references/16.cash-flow-statements.md): Get cash flow statements for any US stock ticker. Operating, investing, and financing cash flows over 30+ years.
- [Income Statement](references/17.income-statement-segments.md): Get income statement segment breakdowns (revenue, operating income, depreciation) by product and business segment for any US public company.
- [Income Statements](references/18.income-statements.md): Get income statements for any US stock ticker. Revenue, expenses, and net income over 30+ years of history.
- [Line Items](references/19.line-items.md): Search for specific financial statement line items across all US public companies.
- [Stock Screener](references/20.stock-screener.md): Screen and filter stocks by financial metrics like revenue, net income, P/E ratio, and more.
- [Funds (by holding)](references/21.funds-by-holding.md): Find which ETFs and index funds hold a given security, and at what weight, sourced direct from SEC fund holdings filings.
- [Holdings (by fund)](references/22.holdings-by-fund.md): Get an ETF or index fund's holdings and each position's weight, sourced direct from SEC fund holdings filings.
- [Insider Ownership](references/23.insider-ownership.md): See what company insiders actually own, from SEC Forms 3 and 5. Initial ownership statements and annual holdings for officers, directors, and 10% owners.
- [Insider Trades](references/24.insider-trades.md): Get SEC Form 4 insider trading data for any US stock. Includes buy/sell transactions by officers and directors.
- [Holdings (by investor)](references/25.holdings-by-investor.md): Get the 13F portfolio of any institutional investment manager, by SEC CIK.
- [Owners (by ticker)](references/26.owners-by-ticker.md): Get the institutional investors who currently hold a given stock, sourced direct from SEC 13F filings.
- [Guidance](references/27.guidance.md): Get forward guidance from earnings releases.
- [Metrics](references/28.metrics.md): Get operational key performance indicators from earnings releases.
- [Non-GAAP Metrics](references/29.non-gaap-metrics.md): Get non-GAAP financial metrics with GAAP reconciliation context.
- [Historical](references/30.interest-rates-historical.md): Get historical US interest rate data including Federal Funds Rate, Treasury yields, and SOFR.
- [Snapshot](references/31.interest-rates-snapshot.md): Get a real-time snapshot of current US interest rates including Fed Funds Rate, Treasury yields, and SOFR.
- [Company News](references/32.company-news.md): Get the latest news articles and press coverage for any US public company by stock ticker.
- [Market News](references/33.market-news.md): Get the latest broad market news covering macro, rates, earnings, geopolitics, energy, crypto, and other market-moving topics.
- [Historical](references/34.historical-prices.md): Get historical stock prices for any US ticker. Daily, weekly, monthly, or yearly OHLCV data.
- [Market Snapshot](references/35.market-snapshot.md): Get a real-time price snapshot for every actively traded US stock in a single request.
- [Company Snapshot](references/36.company-snapshot.md): Get the latest real-time stock price snapshot for any US ticker including open, high, low, and close.
- [Data Provenance](references/37.data-provenance.md): Primary-source financial data with full provenance transparency.
- [How to Get Fundamentals](references/38.how-to-get-fundamentals.md): Learn how to fetch and analyze income statements, balance sheets, and cash flow statements for any US stock using Python.
- [How to Get Stock Prices](references/39.how-to-get-stock-prices.md): Learn how to fetch historical stock price data for any US ticker using Python and the Financial Datasets API. Includes daily, weekly, and monthly intervals.
- [How to Search SEC Filings](references/40.how-to-search-sec-filings.md): Learn how to search and retrieve SEC filings (10-K, 10-Q, 8-K) and extract specific sections like Risk Factors using Python.
- [How to Set Up Webhooks](references/41.how-to-set-up-webhooks.md): Receive real-time market events at your own endpoint. Step-by-step with a working Python receiver and signature verification.
- [Introduction](references/42.introduction.md): Stock market infrastructure for AI agents.
- [Market Coverage](references/43.market-coverage.md): Complete US public company data for 27,000+ tickers over 30+ years.
- [MCP Server](references/44.mcp-server.md): Access the official MCP server for Financial Datasets.
- [OpenAPI Spec](references/45.openapi-spec.md): Machine-readable API specification for programmatic integration
- [Quick Start](references/46.quick-start.md): Get started with the Financial Datasets API in under 2 minutes. Install, authenticate, and make your first stock data API call.
- [Webhooks](references/47.webhooks.md): Push notifications for real-time market events. Pro and Enterprise.

## OpenAPI Specs

- [openapi](references/48.openapi.json)

## Optional

- [Dashboard](https://financialdatasets.ai)
- [Pricing](https://financialdatasets.ai/pricing)
- [Discord](https://discord.gg/hTtb8wzgSQ)
