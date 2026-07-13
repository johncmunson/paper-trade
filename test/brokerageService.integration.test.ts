import { sql } from "drizzle-orm"
import { describe, expect, test } from "vitest"
import { db } from "../db"
import {
  accountActivities,
  accounts,
  idempotencyKeys,
  positions,
} from "../db/schema"
import { postgresBrokerageStore } from "../db/brokerageStore"
import {
  createBrokerageAccount,
  depositCash,
  getDailyHistoricalPrices,
  listAccountActivities,
  lookUpTradableSecurity,
  quoteTradableSecurity,
  readBrokerageAccount,
  submitMarketOrder as submitBuyMarketOrder,
  withdrawCash,
  type BrokerageStore,
  type MarketOrderCommand,
} from "../lib/brokerageService"
import type { FinancialDatasetsResult } from "../lib/financialDatasets"

const fetchSupportedFacts = async (
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

function submitMarketOrder(
  store: BrokerageStore,
  fetchQuote: (ticker: string) => Promise<FinancialDatasetsResult>,
  command: MarketOrderCommand,
  options: { now?: Date; marketAlwaysOpen?: boolean } = {},
) {
  return submitBuyMarketOrder(
    store,
    fetchSupportedFacts,
    fetchQuote,
    command,
    options,
  )
}

describe("Brokerage Account persistence", () => {
  test("market-data reads do not persist brokerage state", async () => {
    const fetchFacts = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "AAPL",
        name: "Apple Inc.",
        exchange: "NASDAQ",
        isActive: true,
      },
    })
    const fetchQuote = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "AAPL",
        price: 100,
        quoteTimestamp: "2026-01-15T14:30:00.000Z",
      },
    })
    const fetchPrices = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: { ticker: "AAPL", prices: [] },
    })

    expect((await lookUpTradableSecurity(fetchFacts, "AAPL")).status).toBe(200)
    expect((await quoteTradableSecurity(fetchQuote, "AAPL")).status).toBe(200)
    expect(
      (
        await getDailyHistoricalPrices(
          fetchFacts,
          fetchPrices,
          "AAPL",
          "2026-01-01",
          "2026-01-02",
        )
      ).status,
    ).toBe(200)

    expect(await db.select().from(accounts)).toHaveLength(0)
    expect(await db.select().from(positions)).toHaveLength(0)
    expect(await db.select().from(accountActivities)).toHaveLength(0)
    expect(await db.select().from(idempotencyKeys)).toHaveLength(0)
  })

  test("creates, replays, rejects conflicts, and reads durable state", async () => {
    const command = {
      investorId: "integration-investor",
      startingCashCents: 50_000,
      idempotencyKey: "open-account",
    }

    const [created, replayed] = await Promise.all([
      createBrokerageAccount(postgresBrokerageStore, command),
      createBrokerageAccount(postgresBrokerageStore, command),
    ])
    expect(created.status).toBe(201)
    expect(replayed).toEqual(created)

    expect(
      await createBrokerageAccount(postgresBrokerageStore, {
        ...command,
        startingCashCents: 50_001,
      }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })

    expect(
      await createBrokerageAccount(postgresBrokerageStore, {
        ...command,
        idempotencyKey: "another-key",
      }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "account_already_exists" } },
    })

    expect(
      await readBrokerageAccount(postgresBrokerageStore, command.investorId),
    ).toEqual({ status: 200, body: created.body })
    expect(
      await readBrokerageAccount(postgresBrokerageStore, "missing"),
    ).toMatchObject({ status: 404, body: { error: { code: "not_found" } } })

    const activities = await db.select().from(accountActivities)
    expect(activities).toHaveLength(1)
    expect(activities[0]).toMatchObject({
      investorId: command.investorId,
      type: "starting_cash",
      amountCents: command.startingCashCents,
    })
  })

  test("moves cash idempotently and preserves immutable Account Activity on rejection", async () => {
    const investorId = "cash-lifecycle-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 100_00,
      idempotencyKey: "open-cash-lifecycle",
    })

    const deposit = await depositCash(postgresBrokerageStore, {
      investorId,
      amountCents: 50_00,
      idempotencyKey: "deposit-1",
    })
    expect(deposit).toMatchObject({
      status: 200,
      body: { availableCashCents: 150_00 },
    })
    expect(
      await depositCash(postgresBrokerageStore, {
        investorId,
        amountCents: 50_00,
        idempotencyKey: "deposit-1",
      }),
    ).toEqual(deposit)
    expect(
      await depositCash(postgresBrokerageStore, {
        investorId,
        amountCents: 50_01,
        idempotencyKey: "deposit-1",
      }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })

    expect(
      await withdrawCash(postgresBrokerageStore, {
        investorId,
        amountCents: 20_00,
        idempotencyKey: "withdraw-1",
      }),
    ).toMatchObject({
      status: 200,
      body: { availableCashCents: 130_00 },
    })
    expect(
      await withdrawCash(postgresBrokerageStore, {
        investorId,
        amountCents: 130_01,
        idempotencyKey: "withdraw-rejected",
      }),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "insufficient_cash" } },
    })

    expect(
      await readBrokerageAccount(postgresBrokerageStore, investorId),
    ).toMatchObject({ status: 200, body: { availableCashCents: 130_00 } })
    expect(
      await listAccountActivities(postgresBrokerageStore, investorId),
    ).toEqual({
      status: 200,
      body: {
        activities: [
          {
            type: "cash_withdrawal",
            amountCents: 20_00,
            createdAt: expect.any(String),
          },
          {
            type: "cash_deposit",
            amountCents: 50_00,
            createdAt: expect.any(String),
          },
          {
            type: "starting_cash",
            amountCents: 100_00,
            createdAt: expect.any(String),
          },
        ],
      },
    })
  })

  test("replays an unknown-Investor cash response after the account is created", async () => {
    const command = {
      investorId: "initially-missing-investor",
      amountCents: 5_00,
      idempotencyKey: "deposit-while-missing",
    }
    const missing = await depositCash(postgresBrokerageStore, command)
    expect(missing).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    })

    await createBrokerageAccount(postgresBrokerageStore, {
      investorId: command.investorId,
      startingCashCents: 10_00,
      idempotencyKey: "open-after-missing",
    })

    expect(await depositCash(postgresBrokerageStore, command)).toEqual(missing)
    expect(
      await readBrokerageAccount(postgresBrokerageStore, command.investorId),
    ).toMatchObject({ status: 200, body: { availableCashCents: 10_00 } })
  })

  test("serializes concurrent withdrawals against Available Cash", async () => {
    const investorId = "concurrent-withdrawal-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 10_00,
      idempotencyKey: "open-concurrent-withdrawal",
    })

    const results = await Promise.all([
      withdrawCash(postgresBrokerageStore, {
        investorId,
        amountCents: 7_00,
        idempotencyKey: "concurrent-withdrawal-1",
      }),
      withdrawCash(postgresBrokerageStore, {
        investorId,
        amountCents: 7_00,
        idempotencyKey: "concurrent-withdrawal-2",
      }),
    ])

    expect(results.map((result) => result.status).sort()).toEqual([200, 422])
    expect(
      await readBrokerageAccount(postgresBrokerageStore, investorId),
    ).toMatchObject({ status: 200, body: { availableCashCents: 3_00 } })
    expect(
      await listAccountActivities(postgresBrokerageStore, investorId),
    ).toMatchObject({
      status: 200,
      body: {
        activities: [
          { type: "cash_withdrawal", amountCents: 7_00 },
          { type: "starting_cash", amountCents: 10_00 },
        ],
      },
    })
  })

  test("buys repeatedly into one Position and replays the original Fill", async () => {
    const investorId = "buy-lifecycle-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 100_000,
      idempotencyKey: "open-buy-lifecycle",
    })
    const fetchFirstQuote = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "AAPL",
        price: 100.005,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
    })
    const firstCommand = {
      investorId,
      side: "buy",
      ticker: " aapl ",
      quantity: 2,
      idempotencyKey: "buy-1",
    }
    const first = await submitMarketOrder(
      postgresBrokerageStore,
      fetchFirstQuote,
      firstCommand,
      { marketAlwaysOpen: true },
    )
    expect(first).toMatchObject({
      status: 200,
      body: {
        type: "buy_fill",
        ticker: "AAPL",
        priceCents: 10_001,
        totalCents: 20_002,
      },
    })
    expect(
      await submitMarketOrder(
        postgresBrokerageStore,
        async () => {
          throw new Error("idempotent replay must not fetch")
        },
        firstCommand,
      ),
    ).toEqual(first)

    expect(
      await submitMarketOrder(
        postgresBrokerageStore,
        async (): Promise<FinancialDatasetsResult> => ({
          status: "ok",
          data: {
            ticker: "AAPL",
            price: 200,
            quoteTimestamp: "2026-07-13T14:30:45.000Z",
          },
        }),
        {
          ...firstCommand,
          ticker: "AAPL",
          quantity: 1,
          idempotencyKey: "buy-2",
        },
        { marketAlwaysOpen: true },
      ),
    ).toMatchObject({ status: 200, body: { totalCents: 20_000 } })

    expect(
      await readBrokerageAccount(postgresBrokerageStore, investorId),
    ).toEqual({
      status: 200,
      body: {
        investorId,
        availableCashCents: 59_998,
        realizedGainLossCents: 0,
        positions: [
          { ticker: "AAPL", quantity: 3, averageCostBasisCents: 13_334 },
        ],
      },
    })
    expect(await db.select().from(positions)).toMatchObject([
      { ticker: "AAPL", quantity: 3, totalCostBasisCents: 40_002 },
    ])
    expect(
      await listAccountActivities(postgresBrokerageStore, investorId),
    ).toMatchObject({
      status: 200,
      body: {
        activities: [
          { type: "buy_fill", quantity: 1, totalCents: 20_000 },
          { type: "buy_fill", quantity: 2, totalCents: 20_002 },
          { type: "starting_cash", amountCents: 100_000 },
        ],
      },
    })
    expect(await db.select().from(idempotencyKeys)).toHaveLength(3)
  })

  test("rolls back every Buy write when its transaction fails", async () => {
    const investorId = "buy-rollback-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 100_00,
      idempotencyKey: "open-buy-rollback",
    })
    const failingStore: BrokerageStore = {
      ...postgresBrokerageStore,
      transaction: (work) =>
        postgresBrokerageStore.transaction((transaction) =>
          work({
            ...transaction,
            insertIdempotency: async () => {
              throw new Error("forced transaction failure")
            },
          }),
        ),
    }

    await expect(
      submitMarketOrder(
        failingStore,
        async (): Promise<FinancialDatasetsResult> => ({
          status: "ok",
          data: {
            ticker: "AAPL",
            price: 50,
            quoteTimestamp: "2026-07-13T14:29:45.000Z",
          },
        }),
        {
          investorId,
          side: "buy",
          ticker: "AAPL",
          quantity: 1,
          idempotencyKey: "buy-rollback",
        },
        { marketAlwaysOpen: true },
      ),
    ).rejects.toThrow("forced transaction failure")

    expect(
      await readBrokerageAccount(postgresBrokerageStore, investorId),
    ).toMatchObject({
      status: 200,
      body: { availableCashCents: 100_00, positions: [] },
    })
    expect(await db.select().from(positions)).toHaveLength(0)
    expect(await db.select().from(accountActivities)).toHaveLength(1)
    expect(await db.select().from(idempotencyKeys)).toHaveLength(1)
  })

  test("serializes concurrent Buys against Available Cash", async () => {
    const investorId = "concurrent-buy-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 100_00,
      idempotencyKey: "open-concurrent-buy",
    })
    const fetchQuote = async (): Promise<FinancialDatasetsResult> => ({
      status: "ok",
      data: {
        ticker: "AAPL",
        price: 70,
        quoteTimestamp: "2026-07-13T14:29:45.000Z",
      },
    })
    const order = (idempotencyKey: string) =>
      submitMarketOrder(
        postgresBrokerageStore,
        fetchQuote,
        {
          investorId,
          side: "buy",
          ticker: "AAPL",
          quantity: 1,
          idempotencyKey,
        },
        { marketAlwaysOpen: true },
      )

    const results = await Promise.all([order("buy-1"), order("buy-2")])
    expect(results.map((result) => result.status).sort()).toEqual([200, 422])
    expect(
      await readBrokerageAccount(postgresBrokerageStore, investorId),
    ).toMatchObject({
      status: 200,
      body: {
        availableCashCents: 30_00,
        positions: [{ ticker: "AAPL", quantity: 1 }],
      },
    })
    expect(
      (await db.select().from(accountActivities)).filter(
        (activity) => activity.type === "buy_fill",
      ),
    ).toHaveLength(1)
  })

  test("returns Fill Account Activity without persistence fields", async () => {
    const investorId = "fill-activity-investor"
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId,
      startingCashCents: 10_00,
      idempotencyKey: "open-fill-activity",
    })
    const quoteTimestamp = new Date("2026-07-13T14:30:00.000Z")
    await expect(
      db.insert(accountActivities).values({
        investorId,
        type: "buy_fill",
        ticker: "AAPL",
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } })

    await db.insert(accountActivities).values([
      {
        investorId,
        type: "buy_fill",
        ticker: "AAPL",
        quantity: 2,
        priceCents: 100_00,
        totalCents: 200_00,
        quoteTimestamp,
      },
      {
        investorId,
        type: "sell_fill",
        ticker: "AAPL",
        quantity: 1,
        priceCents: 120_00,
        totalCents: 120_00,
        costBasisCents: 100_00,
        realizedGainLossCents: 20_00,
        quoteTimestamp,
      },
    ])

    expect(
      await listAccountActivities(postgresBrokerageStore, investorId),
    ).toEqual({
      status: 200,
      body: {
        activities: [
          {
            type: "sell_fill",
            ticker: "AAPL",
            quantity: 1,
            priceCents: 120_00,
            totalCents: 120_00,
            costBasisCents: 100_00,
            realizedGainLossCents: 20_00,
            quoteTimestamp: quoteTimestamp.toISOString(),
            createdAt: expect.any(String),
          },
          {
            type: "buy_fill",
            ticker: "AAPL",
            quantity: 2,
            priceCents: 100_00,
            totalCents: 200_00,
            quoteTimestamp: quoteTimestamp.toISOString(),
            createdAt: expect.any(String),
          },
          {
            type: "starting_cash",
            amountCents: 10_00,
            createdAt: expect.any(String),
          },
        ],
      },
    })
  })

  test("database constraints protect Position uniqueness and non-negative state", async () => {
    await createBrokerageAccount(postgresBrokerageStore, {
      investorId: "constrained-investor",
      startingCashCents: 0,
      idempotencyKey: "open-constrained",
    })

    await db.insert(positions).values({
      investorId: "constrained-investor",
      ticker: "AAPL",
      quantity: 3,
      totalCostBasisCents: 100,
    })

    expect(
      await readBrokerageAccount(
        postgresBrokerageStore,
        "constrained-investor",
      ),
    ).toMatchObject({
      body: {
        positions: [
          {
            ticker: "AAPL",
            quantity: 3,
            averageCostBasisCents: 33,
          },
        ],
      },
    })

    await expect(
      db.insert(positions).values({
        investorId: "constrained-investor",
        ticker: "AAPL",
        quantity: 1,
        totalCostBasisCents: 100,
      }),
    ).rejects.toMatchObject({ cause: { code: "23505" } })

    await expect(
      db.insert(positions).values({
        investorId: "constrained-investor",
        ticker: "msft",
        quantity: 1,
        totalCostBasisCents: 100,
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } })

    await expect(
      db.execute(sql`
        update accounts
        set available_cash_cents = -1
        where investor_id = 'constrained-investor'
      `),
    ).rejects.toMatchObject({ cause: { code: "23514" } })
  })
})
