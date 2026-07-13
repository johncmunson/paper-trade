import { describe, expect, test } from "vitest"
import { marketAlwaysOpen } from "../lib/marketConfig"

describe("market configuration", () => {
  test("enables the always-open override wherever it is configured", () => {
    for (const NODE_ENV of ["development", "test", "production"] as const) {
      expect(
        marketAlwaysOpen({
          NODE_ENV,
          PAPER_TRADE_MARKET_ALWAYS_OPEN: "true",
        }),
      ).toBe(true)
    }

    expect(
      marketAlwaysOpen({
        NODE_ENV: "production",
        PAPER_TRADE_MARKET_ALWAYS_OPEN: "false",
      }),
    ).toBe(false)
  })
})
