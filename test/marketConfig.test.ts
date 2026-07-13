import { describe, expect, test } from "vitest"
import { marketAlwaysOpen } from "../lib/marketConfig"

describe("market configuration", () => {
  test("allows the always-open override only in local development", () => {
    expect(
      marketAlwaysOpen({
        NODE_ENV: "development",
        PAPER_TRADE_MARKET_ALWAYS_OPEN: "true",
      }),
    ).toBe(true)
    expect(
      marketAlwaysOpen({
        NODE_ENV: "test",
        PAPER_TRADE_MARKET_ALWAYS_OPEN: "true",
      }),
    ).toBe(false)
    expect(() =>
      marketAlwaysOpen({
        NODE_ENV: "production",
        PAPER_TRADE_MARKET_ALWAYS_OPEN: "true",
      }),
    ).toThrow("PAPER_TRADE_MARKET_ALWAYS_OPEN")
  })
})
