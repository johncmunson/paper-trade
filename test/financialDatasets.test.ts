import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, test } from "vitest"
import {
  fetchFinancialDatasetsFacts,
  fetchFinancialDatasetsHistoricalPrices,
  fetchFinancialDatasetsQuote,
} from "../lib/financialDatasets"
import { server } from "./unitSetup"

const previousApiKey = process.env.FINANCIAL_DATASETS_API_KEY

afterEach(() => {
  if (previousApiKey === undefined) {
    delete process.env.FINANCIAL_DATASETS_API_KEY
  } else {
    process.env.FINANCIAL_DATASETS_API_KEY = previousApiKey
  }
})

describe("Financial Datasets wrapper", () => {
  test("does not make a request without the server-only API key", async () => {
    delete process.env.FINANCIAL_DATASETS_API_KEY

    expect(await fetchFinancialDatasetsFacts("AAPL")).toEqual({
      status: "unavailable",
    })
  })

  test("fetches market data with the server-only API key", async () => {
    process.env.FINANCIAL_DATASETS_API_KEY = "test-provider-key"
    const facts = {
      company_facts: {
        ticker: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        is_active: true,
      },
    }
    const quote = {
      snapshot: {
        ticker: "AAPL",
        price: 100,
        time_milliseconds: 1_768_487_400_000,
      },
    }
    const historicalPrices = {
      prices: [
        {
          ticker: "AAPL",
          open: 243.85,
          high: 244.15,
          low: 241.91,
          close: 243.36,
          volume: null,
          time: "2026-01-02",
        },
      ],
    }
    const respond = (request: Request, body: object) =>
      request.headers.get("x-api-key") === "test-provider-key" &&
      new URL(request.url).searchParams.get("ticker") === "AAPL"
        ? HttpResponse.json(body)
        : HttpResponse.json({ error: "bad request" }, { status: 400 })

    server.use(
      http.get(
        "https://api.financialdatasets.ai/company/facts",
        ({ request }) => respond(request, facts),
      ),
      http.get(
        "https://api.financialdatasets.ai/prices/snapshot",
        ({ request }) => respond(request, quote),
      ),
      http.get("https://api.financialdatasets.ai/prices", ({ request }) => {
        const params = new URL(request.url).searchParams
        return request.headers.get("x-api-key") === "test-provider-key" &&
          params.get("ticker") === "AAPL" &&
          params.get("interval") === "day" &&
          params.get("start_date") === "2026-01-02" &&
          params.get("end_date") === "2026-01-05"
          ? HttpResponse.json(historicalPrices)
          : HttpResponse.json({ error: "bad request" }, { status: 400 })
      }),
    )

    expect(await fetchFinancialDatasetsFacts("AAPL")).toEqual({
      status: "ok",
      data: {
        ticker: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        isActive: true,
      },
    })
    expect(await fetchFinancialDatasetsQuote("AAPL")).toEqual({
      status: "ok",
      data: {
        ticker: "AAPL",
        price: 100,
        quoteTimestamp: "2026-01-15T14:30:00.000Z",
      },
    })
    expect(
      await fetchFinancialDatasetsHistoricalPrices(
        "AAPL",
        "2026-01-02",
        "2026-01-05",
      ),
    ).toEqual({
      status: "ok",
      data: {
        ticker: "AAPL",
        prices: [
          {
            date: "2026-01-02",
            open: 243.85,
            high: 244.15,
            low: 241.91,
            close: 243.36,
            volume: null,
          },
        ],
      },
    })
  })

  test("maps unknown Tickers and provider failures without exposing responses", async () => {
    process.env.FINANCIAL_DATASETS_API_KEY = "test-provider-key"
    server.use(
      http.get("https://api.financialdatasets.ai/company/facts", () =>
        HttpResponse.json({ message: "provider detail" }, { status: 404 }),
      ),
      http.get("https://api.financialdatasets.ai/prices/snapshot", () =>
        HttpResponse.json(
          { message: "secret provider detail" },
          { status: 401 },
        ),
      ),
    )

    expect(await fetchFinancialDatasetsFacts("NOPE")).toEqual({
      status: "not_found",
    })
    expect(await fetchFinancialDatasetsQuote("AAPL")).toEqual({
      status: "unavailable",
    })
  })

  test("maps malformed and unavailable responses to unavailable", async () => {
    process.env.FINANCIAL_DATASETS_API_KEY = "test-provider-key"
    server.use(
      http.get(
        "https://api.financialdatasets.ai/company/facts",
        () => new HttpResponse("not json", { status: 200 }),
      ),
      http.get("https://api.financialdatasets.ai/prices/snapshot", () =>
        HttpResponse.error(),
      ),
      http.get("https://api.financialdatasets.ai/prices", () =>
        HttpResponse.json({ prices: [{ ticker: "WRONG" }] }),
      ),
    )

    expect(await fetchFinancialDatasetsFacts("AAPL")).toEqual({
      status: "unavailable",
    })
    expect(await fetchFinancialDatasetsQuote("AAPL")).toEqual({
      status: "unavailable",
    })
    expect(
      await fetchFinancialDatasetsHistoricalPrices(
        "AAPL",
        "2026-01-02",
        "2026-01-05",
      ),
    ).toEqual({ status: "unavailable" })
  })
})
