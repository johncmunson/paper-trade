import { describe, expect, test } from "vitest"
import {
  isMarketOpen,
  submitMarketOrder as submitApplicationMarketOrder,
  withdrawCash,
  type BrokerageAccount,
  type BrokerageStore,
  type BuyFill,
  type IdempotencyRecord,
  type SellFill,
  type MarketOrderCommand,
} from "../lib/brokerageService"
import type { FinancialDatasetsResult } from "../lib/financialDatasets"

type BrokerageTransaction = Parameters<
  Parameters<BrokerageStore["transaction"]>[0]
>[0]

const mondayOpen = new Date("2026-07-13T14:30:00.000Z")

const supportedFacts = async (
  ticker: string,
): Promise<FinancialDatasetsResult> => ({
  status: "ok",
  data: {
    ticker,
    name: "Supported Security",
    exchange: "NASDAQ",
    isActive: true,
  },
})

function quote(price: number, quoteTimestamp = "2026-07-13T14:29:45.000Z") {
  return async (ticker: string): Promise<FinancialDatasetsResult> => ({
    status: "ok",
    data: { ticker, price, quoteTimestamp },
  })
}

function submitMarketOrder(
  store: BrokerageStore,
  fetchQuote: (ticker: string) => Promise<FinancialDatasetsResult>,
  command: MarketOrderCommand,
  options: { now?: Date; marketAlwaysOpen?: boolean } = {},
) {
  return submitApplicationMarketOrder(
    store,
    supportedFacts,
    fetchQuote,
    command,
    options,
  )
}

function memoryStore(availableCashCents = 100_000) {
  const investorId = "investor-1"
  const accounts = new Map<string, BrokerageAccount>([
    [
      investorId,
      {
        investorId,
        availableCashCents,
        realizedGainLossCents: 0,
        positions: [],
      },
    ],
  ])
  const storedPositions = new Map<
    string,
    { quantity: number; totalCostBasisCents: number }
  >()
  const activities: Array<
    (BuyFill | SellFill) & { investorId: string; createdAt: string }
  > = []
  const idempotency = new Map<string, IdempotencyRecord>()

  const store: BrokerageStore = {
    transaction: async (work) => {
      const accountSnapshot = structuredClone(accounts)
      const positionSnapshot = structuredClone(storedPositions)
      const activitySnapshot = structuredClone(activities)
      const idempotencySnapshot = structuredClone(idempotency)
      try {
        const transaction: BrokerageTransaction = {
          lockIdempotency: async () => {},
          findIdempotency: async (investorId, key) =>
            structuredClone(idempotency.get(`${investorId}:${key}`)),
          insertAccount: async () => false,
          insertStartingCashActivity: async () => {},
          lockAccount: async (investorId) =>
            structuredClone(accounts.get(investorId)),
          updateAvailableCash: async (investorId, amount) => {
            const account = accounts.get(investorId)
            if (account) account.availableCashCents = amount
          },
          insertCashActivity: async () => {},
          updateRealizedGainLoss: async (investorId, amount) => {
            const account = accounts.get(investorId)
            if (account) account.realizedGainLossCents = amount
          },
          findPosition: async (investorId, ticker) =>
            structuredClone(storedPositions.get(`${investorId}:${ticker}`)),
          upsertPosition: async (
            investorId,
            ticker,
            quantity,
            totalCostBasisCents,
          ) => {
            storedPositions.set(`${investorId}:${ticker}`, {
              quantity,
              totalCostBasisCents,
            })
            const account = accounts.get(investorId)
            if (!account) return
            const position = {
              ticker,
              quantity,
              averageCostBasisCents: Math.round(totalCostBasisCents / quantity),
            }
            const index = account.positions.findIndex(
              (current) => current.ticker === ticker,
            )
            if (index < 0) account.positions.push(position)
            else account.positions[index] = position
          },
          deletePosition: async (investorId, ticker) => {
            storedPositions.delete(`${investorId}:${ticker}`)
            const account = accounts.get(investorId)
            if (account) {
              account.positions = account.positions.filter(
                (position) => position.ticker !== ticker,
              )
            }
          },
          insertFillActivity: async (investorId, fill) => {
            activities.push({
              investorId,
              ...fill,
              createdAt: new Date(
                Date.UTC(2026, 6, 13, 14, 30, activities.length),
              ).toISOString(),
            })
          },
          insertIdempotency: async (record) => {
            idempotency.set(
              `${record.investorId}:${record.key}`,
              structuredClone(record),
            )
          },
        }
        return await work(transaction)
      } catch (error) {
        accounts.clear()
        for (const entry of accountSnapshot) accounts.set(...entry)
        storedPositions.clear()
        for (const entry of positionSnapshot) storedPositions.set(...entry)
        activities.splice(0, activities.length, ...activitySnapshot)
        idempotency.clear()
        for (const entry of idempotencySnapshot) idempotency.set(...entry)
        throw error
      }
    },
    findAccount: async (investorId) =>
      structuredClone(accounts.get(investorId)),
    findActivities: async (investorId, limit) =>
      activities
        .filter((activity) => activity.investorId === investorId)
        .slice(-limit)
        .reverse()
        .map(({ investorId: _investorId, ...activity }) => activity),
  }

  return { store, accounts, storedPositions, activities, idempotency }
}

function command(overrides: Record<string, unknown> = {}) {
  return {
    investorId: "investor-1",
    side: "buy",
    ticker: " aapl ",
    quantity: 2,
    idempotencyKey: "buy-1",
    ...overrides,
  }
}

describe("Market Orders", () => {
  test("uses the weekday New York half-open market session independently of machine timezone", () => {
    expect(isMarketOpen(new Date("2026-01-12T14:29:59.999Z"))).toBe(false)
    expect(isMarketOpen(new Date("2026-01-12T14:30:00.000Z"))).toBe(true)
    expect(isMarketOpen(new Date("2026-01-12T20:59:59.999Z"))).toBe(true)
    expect(isMarketOpen(new Date("2026-01-12T21:00:00.000Z"))).toBe(false)
    expect(isMarketOpen(new Date("2026-07-13T13:30:00.000Z"))).toBe(true)
    expect(isMarketOpen(new Date("2026-07-11T14:30:00.000Z"))).toBe(false)
  })

  test("validates a Buy before fetching a quote", async () => {
    const { store } = memoryStore()
    let quoteRequests = 0
    const fetchQuote = async (): Promise<FinancialDatasetsResult> => {
      quoteRequests++
      return { status: "unavailable" }
    }

    for (const invalid of [
      command({ side: "hold" }),
      command({ ticker: "not a ticker" }),
      command({ quantity: 0 }),
      command({ quantity: -1 }),
      command({ quantity: 1.5 }),
      command({ quantity: Number.MAX_SAFE_INTEGER + 1 }),
      command({ idempotencyKey: "" }),
    ]) {
      expect(
        await submitMarketOrder(store, fetchQuote, invalid, {
          now: mondayOpen,
        }),
      ).toMatchObject({
        status: 400,
        body: { error: { code: "invalid_request" } },
      })
    }
    expect(quoteRequests).toBe(0)
  })

  test("rejects a closed session while the always-open override bypasses only that check", async () => {
    const { store } = memoryStore()
    const saturday = new Date("2026-07-11T14:30:00.000Z")

    expect(
      await submitMarketOrder(store, quote(100), command(), { now: saturday }),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "market_closed" } },
    })

    expect(
      await submitMarketOrder(
        store,
        async () => {
          throw new Error("terminal market closure must replay")
        },
        command(),
        { now: saturday, marketAlwaysOpen: true },
      ),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "market_closed" } },
    })

    expect(
      await submitMarketOrder(
        store,
        quote(100),
        command({ idempotencyKey: "override-open" }),
        { now: saturday, marketAlwaysOpen: true },
      ),
    ).toMatchObject({ status: 200, body: { ticker: "AAPL" } })

    expect(
      await submitMarketOrder(
        store,
        async () => ({ status: "unavailable" }),
        command({ idempotencyKey: "override-provider-failure" }),
        { now: saturday, marketAlwaysOpen: true },
      ),
    ).toMatchObject({
      status: 503,
      body: { error: { code: "market_data_unavailable" } },
    })
  })

  test("leaves financial and idempotency state unchanged when a quote is unavailable", async () => {
    const { store, accounts, storedPositions, activities, idempotency } =
      memoryStore()
    const order = command()

    for (const result of [
      { status: "unavailable" },
      { status: "not_found" },
      {
        status: "ok",
        data: {
          ticker: "AAPL",
          price: 0,
          quoteTimestamp: "2026-07-13T14:29:45.000Z",
        },
      },
    ] satisfies FinancialDatasetsResult[]) {
      expect(
        await submitMarketOrder(store, async () => result, order, {
          now: mondayOpen,
        }),
      ).toMatchObject({
        status: 503,
        body: { error: { code: "market_data_unavailable" } },
      })
    }

    expect(accounts.get("investor-1")?.availableCashCents).toBe(100_000)
    expect(storedPositions).toHaveLength(0)
    expect(activities).toHaveLength(0)
    expect(idempotency).toHaveLength(0)
    expect(
      await submitMarketOrder(store, quote(100), order, { now: mondayOpen }),
    ).toMatchObject({ status: 200 })
  })

  test("rejects a security that is not an active US-listed stock or ETF", async () => {
    const { store, activities } = memoryStore()
    let quoteRequests = 0

    expect(
      await submitApplicationMarketOrder(
        store,
        async () => ({
          status: "ok",
          data: {
            ticker: "VOD",
            name: "Vodafone Group Plc",
            exchange: "LSE",
            isActive: true,
          },
        }),
        async () => {
          quoteRequests++
          return { status: "unavailable" }
        },
        command({ ticker: "vod", idempotencyKey: "unsupported" }),
        { now: mondayOpen },
      ),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "unsupported_ticker" } },
    })
    expect(quoteRequests).toBe(0)
    expect(activities).toHaveLength(0)
  })

  test("buys first and additional shares using integer total cost basis", async () => {
    const { store, accounts, storedPositions, activities } = memoryStore()

    expect(
      await submitMarketOrder(store, quote(100.005), command(), {
        now: mondayOpen,
      }),
    ).toEqual({
      status: 200,
      body: {
        type: "buy_fill",
        ticker: "AAPL",
        quantity: 2,
        priceCents: 10_001,
        totalCents: 20_002,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
    })
    expect(
      await submitMarketOrder(
        store,
        quote(200, "2026-07-13T14:30:45.000Z"),
        command({ quantity: 1, idempotencyKey: "buy-2" }),
        { now: mondayOpen },
      ),
    ).toMatchObject({ body: { totalCents: 20_000 } })

    expect(accounts.get("investor-1")).toEqual({
      investorId: "investor-1",
      availableCashCents: 59_998,
      realizedGainLossCents: 0,
      positions: [
        { ticker: "AAPL", quantity: 3, averageCostBasisCents: 13_334 },
      ],
    })
    expect(storedPositions.get("investor-1:AAPL")).toEqual({
      quantity: 3,
      totalCostBasisCents: 40_002,
    })
    expect(activities).toMatchObject([
      {
        type: "buy_fill",
        ticker: "AAPL",
        quantity: 2,
        priceCents: 10_001,
        totalCents: 20_002,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
      {
        type: "buy_fill",
        ticker: "AAPL",
        quantity: 1,
        priceCents: 20_000,
        totalCents: 20_000,
        quoteTimestamp: "2026-07-13T14:30:45.000Z",
      },
    ])
  })

  test("replays a Fill, rejects conflicting key reuse, and records terminal insufficient cash", async () => {
    const { store, accounts, storedPositions, activities } = memoryStore(10_000)
    const first = command({ quantity: 1 })
    const fill = await submitMarketOrder(store, quote(60), first, {
      now: mondayOpen,
    })

    expect(
      await submitMarketOrder(
        store,
        async () => {
          throw new Error("replay must not fetch a quote")
        },
        first,
        { now: new Date("2026-07-11T14:30:00.000Z") },
      ),
    ).toEqual(fill)
    expect(
      await submitMarketOrder(store, quote(60), command({ quantity: 2 }), {
        now: mondayOpen,
      }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })

    const rejectedOrder = command({
      quantity: 2,
      idempotencyKey: "insufficient",
    })
    const rejected = await submitMarketOrder(store, quote(30), rejectedOrder, {
      now: mondayOpen,
    })
    expect(rejected).toMatchObject({
      status: 422,
      body: { error: { code: "insufficient_cash" } },
    })
    expect(accounts.get("investor-1")?.availableCashCents).toBe(4_000)
    expect(storedPositions.get("investor-1:AAPL")).toEqual({
      quantity: 1,
      totalCostBasisCents: 6_000,
    })
    expect(activities).toHaveLength(1)

    accounts.get("investor-1")!.availableCashCents = 100_000
    expect(
      await submitMarketOrder(
        store,
        async () => {
          throw new Error("terminal rejection must replay")
        },
        rejectedOrder,
        { now: mondayOpen },
      ),
    ).toEqual(rejected)
    expect(activities).toHaveLength(1)
  })

  test("returns not found without creating a Fill", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.clear()

    expect(
      await submitMarketOrder(store, quote(100), command(), {
        now: mondayOpen,
      }),
    ).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    })
    expect(activities).toHaveLength(0)
  })

  test("partially sells at a profit, rounds proportional basis, and makes proceeds immediately withdrawable", async () => {
    const { store, accounts, storedPositions, activities } = memoryStore(10)
    await submitMarketOrder(store, quote(0.01), command({ quantity: 2 }), {
      now: mondayOpen,
    })
    await submitMarketOrder(
      store,
      quote(0.02),
      command({ quantity: 1, idempotencyKey: "buy-2" }),
      { now: mondayOpen },
    )

    const sold = await submitMarketOrder(
      store,
      quote(0.02),
      command({ side: "sell", quantity: 1, idempotencyKey: "sell-1" }),
      { now: mondayOpen },
    )

    expect(sold).toEqual({
      status: 200,
      body: {
        type: "sell_fill",
        ticker: "AAPL",
        quantity: 1,
        priceCents: 2,
        totalCents: 2,
        costBasisCents: 1,
        realizedGainLossCents: 1,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
    })
    expect(storedPositions.get("investor-1:AAPL")).toEqual({
      quantity: 2,
      totalCostBasisCents: 3,
    })
    expect(accounts.get("investor-1")).toMatchObject({
      availableCashCents: 8,
      realizedGainLossCents: 1,
      positions: [
        { ticker: "AAPL", quantity: 2, averageCostBasisCents: 2 },
      ],
    })
    expect(
      await withdrawCash(store, {
        investorId: "investor-1",
        amountCents: 8,
        idempotencyKey: "withdraw-proceeds",
      }),
    ).toMatchObject({ status: 200, body: { availableCashCents: 0 } })
    expect(activities.at(-1)).toMatchObject({
      type: "sell_fill",
      costBasisCents: 1,
      realizedGainLossCents: 1,
    })
  })

  test("completely sells at a loss, removes the Position, and removes its exact remaining basis", async () => {
    const { store, accounts, storedPositions } = memoryStore(10)
    await submitMarketOrder(store, quote(0.02), command(), {
      now: mondayOpen,
    })

    expect(
      await submitMarketOrder(
        store,
        quote(0.01),
        command({ side: "sell", idempotencyKey: "sell-all" }),
        { now: mondayOpen },
      ),
    ).toEqual({
      status: 200,
      body: {
        type: "sell_fill",
        ticker: "AAPL",
        quantity: 2,
        priceCents: 1,
        totalCents: 2,
        costBasisCents: 4,
        realizedGainLossCents: -2,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
    })
    expect(storedPositions.has("investor-1:AAPL")).toBe(false)
    expect(accounts.get("investor-1")).toMatchObject({
      availableCashCents: 8,
      realizedGainLossCents: -2,
      positions: [],
    })
  })

  test("rejects unknown and excessive Positions atomically and leaves provider failures retryable", async () => {
    const { store, accounts, storedPositions, activities, idempotency } =
      memoryStore(10)
    const missing = command({ side: "sell", idempotencyKey: "missing" })
    const beforeMissing = structuredClone({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
    })

    const rejected = await submitMarketOrder(store, quote(1), missing, {
      now: mondayOpen,
    })
    expect(rejected).toMatchObject({
      status: 422,
      body: { error: { code: "insufficient_shares" } },
    })
    expect(idempotency).toHaveLength(1)
    expect({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
    }).toEqual(beforeMissing)

    await submitMarketOrder(store, quote(0.01), command({ quantity: 1 }), {
      now: mondayOpen,
    })
    expect(
      await submitMarketOrder(store, quote(1), missing, { now: mondayOpen }),
    ).toEqual(rejected)
    const beforeTooMany = structuredClone({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
    })
    expect(
      await submitMarketOrder(
        store,
        quote(1),
        command({ side: "sell", quantity: 2, idempotencyKey: "too-many" }),
        { now: mondayOpen },
      ),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "insufficient_shares" } },
    })
    expect({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
    }).toEqual(beforeTooMany)

    const beforeFailure = structuredClone({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
      idempotency,
    })
    expect(
      await submitMarketOrder(
        store,
        async () => ({ status: "unavailable" }),
        command({ side: "sell", quantity: 1, idempotencyKey: "unavailable" }),
        { now: mondayOpen },
      ),
    ).toMatchObject({
      status: 503,
      body: { error: { code: "market_data_unavailable" } },
    })
    expect({
      account: accounts.get("investor-1"),
      position: storedPositions.get("investor-1:AAPL"),
      activities,
      idempotency,
    }).toEqual(beforeFailure)
  })

  test("replays the original Sell Fill and rejects conflicting key reuse", async () => {
    const { store, activities } = memoryStore(10)
    await submitMarketOrder(store, quote(0.01), command(), {
      now: mondayOpen,
    })
    const order = command({
      side: "sell",
      quantity: 1,
      idempotencyKey: "sell-replay",
    })
    const fill = await submitMarketOrder(store, quote(0.02), order, {
      now: mondayOpen,
    })

    expect(
      await submitMarketOrder(
        store,
        async () => {
          throw new Error("replay must not fetch market data")
        },
        order,
        { now: new Date("2026-07-11T14:30:00.000Z") },
      ),
    ).toEqual(fill)
    expect(
      await submitMarketOrder(
        store,
        quote(0.02),
        { ...order, quantity: 2 },
        { now: mondayOpen },
      ),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })
    expect(activities.filter(({ type }) => type === "sell_fill")).toHaveLength(
      1,
    )
  })
})
