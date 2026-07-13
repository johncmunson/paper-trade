import { sql } from "drizzle-orm"
import { describe, expect, test } from "vitest"
import { db } from "../db"
import { accountActivities, positions } from "../db/schema"
import { postgresBrokerageStore } from "../db/brokerageStore"
import {
  createBrokerageAccount,
  readBrokerageAccount,
} from "../lib/brokerageService"

describe("Brokerage Account persistence", () => {
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
