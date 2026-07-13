import { describe, expect, test } from "vitest"
import {
  lookUpTradableSecurity,
  quoteTradableSecurity,
} from "../lib/brokerageService"
import type { FinancialDatasetsResult } from "../lib/financialDatasets"

describe("market-data application service", () => {
  test("looks up an exact Ticker after trimming and normalizing it", async () => {
    let requestedTicker = ""
    const fetchFacts = async (
      ticker: string,
    ): Promise<FinancialDatasetsResult> => {
      requestedTicker = ticker
      return {
        status: "ok",
        data: {
          ticker: "AAPL",
          name: "Apple Inc.",
          exchange: "NASDAQ",
          isActive: true,
        },
      }
    }

    expect(await lookUpTradableSecurity(fetchFacts, "  aapl  ")).toEqual({
      status: 200,
      body: { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
    })
    expect(requestedTicker).toBe("AAPL")
  })

  test("rejects inactive, unknown, and malformed Tickers with stable errors", async () => {
    const inactive = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "OLD",
        name: "Old Company",
        exchange: "NYSE",
        isActive: false,
      },
    })
    const foreignListing = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "VOD",
        name: "Vodafone Group Plc",
        exchange: "LSE",
        isActive: true,
      },
    })
    const unknown = async (): Promise<FinancialDatasetsResult> => ({
      status: "not_found",
    })

    for (const result of [
      await lookUpTradableSecurity(inactive, "OLD"),
      await lookUpTradableSecurity(foreignListing, "VOD"),
      await lookUpTradableSecurity(unknown, "NOPE"),
    ]) {
      expect(result).toEqual({
        status: 422,
        body: {
          error: {
            code: "unsupported_ticker",
            message: "Ticker is not a supported active US-listed stock or ETF.",
          },
        },
      })
    }

    expect(await lookUpTradableSecurity(unknown, "not a ticker!")).toEqual({
      status: 400,
      body: {
        error: {
          code: "invalid_request",
          message: "Ticker is malformed.",
        },
      },
    })
  })

  test("maps provider failures and malformed facts to market-data unavailable", async () => {
    const unavailable = async (): Promise<FinancialDatasetsResult> => ({
      status: "unavailable",
    })
    const malformed = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "WRONG",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        isActive: false,
      },
    })
    const expected = {
      status: 503,
      body: {
        error: {
          code: "market_data_unavailable",
          message: "Market data is temporarily unavailable.",
        },
      },
    }

    expect(await lookUpTradableSecurity(unavailable, "AAPL")).toEqual(expected)
    expect(await lookUpTradableSecurity(malformed, "AAPL")).toEqual(expected)
  })

  test("returns a normalized current quote rounded to the nearest cent", async () => {
    let requestedTicker = ""
    const fetchQuote = async (
      ticker: string,
    ): Promise<FinancialDatasetsResult> => {
      requestedTicker = ticker
      return {
        status: "ok",
        data: {
          ticker: "BRK.B",
          price: 10.075,
          quoteTimestamp: "2026-01-15T14:30:00.000Z",
        },
      }
    }

    expect(await quoteTradableSecurity(fetchQuote, " brk.b ")).toEqual({
      status: 200,
      body: {
        ticker: "BRK.B",
        priceCents: 1008,
        quoteTimestamp: "2026-01-15T14:30:00.000Z",
      },
    })
    expect(requestedTicker).toBe("BRK.B")

    const belowHalfCent = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "BRK.B",
        price: 10.0749,
        quoteTimestamp: "2026-01-15T14:30:00.000Z",
      },
    })
    expect(await quoteTradableSecurity(belowHalfCent, "BRK.B")).toMatchObject({
      body: { priceCents: 1007 },
    })
  })

  test("rejects unusable quotes without exposing provider data", async () => {
    const expectedUnavailable = {
      status: 503,
      body: {
        error: {
          code: "market_data_unavailable",
          message: "Market data is temporarily unavailable.",
        },
      },
    }

    for (const result of [
      { status: "unavailable" },
      { status: "not_found" },
      {
        status: "ok",
        data: {
          ticker: "AAPL",
          price: 0,
          quoteTimestamp: "2026-01-15T14:30:00.000Z",
        },
      },
      {
        status: "ok",
        data: {
          ticker: "WRONG",
          price: 100,
          quoteTimestamp: "2026-01-15T14:30:00.000Z",
        },
      },
    ] satisfies FinancialDatasetsResult[]) {
      const fetchQuote = async () => result
      const response = await quoteTradableSecurity(fetchQuote, "AAPL")
      expect(response).toEqual(
        result.status === "not_found"
          ? {
              status: 422,
              body: {
                error: {
                  code: "unsupported_ticker",
                  message:
                    "Ticker is not a supported active US-listed stock or ETF.",
                },
              },
            }
          : expectedUnavailable,
      )
    }

    expect(
      await quoteTradableSecurity(async () => {
        throw new Error("should not be called")
      }, "$$$"),
    ).toEqual({
      status: 400,
      body: {
        error: { code: "invalid_request", message: "Ticker is malformed." },
      },
    })
  })

  test("looks up a supported ETF", async () => {
    const fetchFacts = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        exchange: "NYSE Arca",
        isActive: true,
      },
    })

    expect(await lookUpTradableSecurity(fetchFacts, "spy")).toEqual({
      status: 200,
      body: {
        ticker: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        exchange: "NYSE Arca",
      },
    })
  })
})
