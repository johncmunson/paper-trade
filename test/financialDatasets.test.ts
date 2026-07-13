import { HttpResponse, http } from "msw"
import { afterEach, describe, expect, test } from "vitest"
import {
  fetchFinancialDatasetsFacts,
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

  test("fetches facts and quotes with the server-only API key", async () => {
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
    )

    expect(await fetchFinancialDatasetsFacts("AAPL")).toEqual({
      status: "unavailable",
    })
    expect(await fetchFinancialDatasetsQuote("AAPL")).toEqual({
      status: "unavailable",
    })
  })
})
