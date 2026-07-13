import { describe, expect, test } from "vitest"
import {
  createBrokerageAccount,
  depositCash,
  listAccountActivities,
  readBrokerageAccount,
  withdrawCash,
  type AccountActivity,
  type BrokerageAccount,
  type BrokerageStore,
  type IdempotencyRecord,
} from "../lib/brokerageService"

function memoryStore() {
  const accounts = new Map<string, BrokerageAccount>()
  const activities: Array<AccountActivity & { investorId: string }> = []
  const idempotency = new Map<string, IdempotencyRecord>()
  let activitySequence = 0

  const store: BrokerageStore = {
    transaction: async (work) =>
      work({
        lockIdempotency: async () => {},
        findIdempotency: async (investorId, key) => {
          const record = idempotency.get(`${investorId}:${key}`)
          return record && structuredClone(record)
        },
        insertAccount: async (account) => {
          if (accounts.has(account.investorId)) return false
          accounts.set(account.investorId, structuredClone(account))
          return true
        },
        insertStartingCashActivity: async (investorId, amountCents) => {
          activities.push({
            investorId,
            type: "starting_cash",
            amountCents,
            createdAt: new Date(
              Date.UTC(2026, 0, 1, 0, 0, activitySequence++),
            ).toISOString(),
          })
        },
        lockAccount: async (investorId) => {
          const account = accounts.get(investorId)
          return account && structuredClone(account)
        },
        updateAvailableCash: async (investorId, availableCashCents) => {
          const account = accounts.get(investorId)
          if (account) account.availableCashCents = availableCashCents
        },
        insertCashActivity: async (investorId, type, amountCents) => {
          activities.push({
            investorId,
            type,
            amountCents,
            createdAt: new Date(
              Date.UTC(2026, 0, 1, 0, 0, activitySequence++),
            ).toISOString(),
          })
        },
        findPosition: async () => undefined,
        upsertPosition: async () => {},
        insertBuyActivity: async () => {},
        insertIdempotency: async (record) => {
          idempotency.set(
            `${record.investorId}:${record.key}`,
            structuredClone(record),
          )
        },
      }),
    findAccount: async (investorId) => {
      const account = accounts.get(investorId)
      return account && structuredClone(account)
    },
    findActivities: async (investorId, limit) =>
      activities
        .filter((activity) => activity.investorId === investorId)
        .slice(-limit)
        .reverse()
        .map(({ investorId: _investorId, ...activity }) => activity),
  }

  return { store, accounts, activities }
}

describe("Brokerage Account application service", () => {
  test("creates once, replays the original response, and rejects conflicts", async () => {
    const { store, accounts, activities } = memoryStore()
    const command = {
      investorId: "investor-1",
      startingCashCents: 125_00,
      idempotencyKey: "open-1",
    }

    const created = await createBrokerageAccount(store, command)

    expect(created).toEqual({
      status: 201,
      body: {
        investorId: "investor-1",
        availableCashCents: 125_00,
        realizedGainLossCents: 0,
        positions: [],
      },
    })
    expect(activities).toMatchObject([
      { investorId: "investor-1", amountCents: 125_00 },
    ])

    expect(await createBrokerageAccount(store, command)).toEqual(created)
    expect(activities).toHaveLength(1)

    expect(
      await createBrokerageAccount(store, {
        ...command,
        startingCashCents: 126_00,
      }),
    ).toEqual({
      status: 409,
      body: {
        error: {
          code: "idempotency_conflict",
          message: "Idempotency key was already used with a different request.",
        },
      },
    })

    expect(
      await createBrokerageAccount(store, {
        ...command,
        idempotencyKey: "open-2",
      }),
    ).toEqual({
      status: 409,
      body: {
        error: {
          code: "account_already_exists",
          message: "A Brokerage Account already exists for this Investor.",
        },
      },
    })
    expect(accounts.get("investor-1")?.availableCashCents).toBe(125_00)
    expect(activities).toHaveLength(1)
  })

  test("deposits cash immediately", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.set("investor-1", {
      investorId: "investor-1",
      availableCashCents: 10_00,
      realizedGainLossCents: 0,
      positions: [],
    })

    expect(
      await depositCash(store, {
        investorId: "investor-1",
        amountCents: 25_00,
        idempotencyKey: "deposit-1",
      }),
    ).toEqual({
      status: 200,
      body: {
        investorId: "investor-1",
        availableCashCents: 35_00,
        realizedGainLossCents: 0,
        positions: [],
      },
    })
    expect(accounts.get("investor-1")?.availableCashCents).toBe(35_00)
    expect(activities).toHaveLength(1)
  })

  test("rejects malformed cash movement commands before changing state", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.set("investor-1", {
      investorId: "investor-1",
      availableCashCents: 50_00,
      realizedGainLossCents: 0,
      positions: [],
    })

    for (const [amountCents, idempotencyKey] of [
      [0, "zero"],
      [-1, "negative"],
      [1.5, "fractional"],
      [Number.MAX_SAFE_INTEGER + 1, "unsafe"],
      ["100", "malformed"],
      [100, ""],
    ] as const) {
      expect(
        await depositCash(store, {
          investorId: "investor-1",
          amountCents: amountCents as number,
          idempotencyKey,
        }),
      ).toMatchObject({
        status: 400,
        body: { error: { code: "invalid_request" } },
      })
    }

    expect(accounts.get("investor-1")?.availableCashCents).toBe(50_00)
    expect(activities).toHaveLength(0)
  })

  test("rejects a Cash Deposit that would make Available Cash unsafe", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.set("investor-1", {
      investorId: "investor-1",
      availableCashCents: Number.MAX_SAFE_INTEGER,
      realizedGainLossCents: 0,
      positions: [],
    })

    expect(
      await depositCash(store, {
        investorId: "investor-1",
        amountCents: 1,
        idempotencyKey: "deposit-overflow",
      }),
    ).toMatchObject({
      status: 422,
      body: { error: { code: "cash_limit_exceeded" } },
    })
    expect(accounts.get("investor-1")?.availableCashCents).toBe(
      Number.MAX_SAFE_INTEGER,
    )
    expect(activities).toHaveLength(0)
  })

  test("replays cash movements, rejects conflicting key reuse, and returns not found", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.set("investor-1", {
      investorId: "investor-1",
      availableCashCents: 10_00,
      realizedGainLossCents: 0,
      positions: [],
    })
    const command = {
      investorId: "investor-1",
      amountCents: 5_00,
      idempotencyKey: "cash-1",
    }

    const deposited = await depositCash(store, command)
    expect(await depositCash(store, command)).toEqual(deposited)
    expect(
      await depositCash(store, { ...command, amountCents: 6_00 }),
    ).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })
    expect(await withdrawCash(store, command)).toMatchObject({
      status: 409,
      body: { error: { code: "idempotency_conflict" } },
    })
    await depositCash(store, {
      ...command,
      amountCents: 1_00,
      idempotencyKey: "cash-2",
    })
    expect(await depositCash(store, command)).toEqual(deposited)

    const missingCommand = { ...command, investorId: "missing" }
    const missing = await depositCash(store, missingCommand)
    expect(missing).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    })
    await createBrokerageAccount(store, {
      investorId: "missing",
      startingCashCents: 10_00,
      idempotencyKey: "open-missing",
    })
    expect(await depositCash(store, missingCommand)).toEqual(missing)
    expect(accounts.get("missing")?.availableCashCents).toBe(10_00)
    expect(accounts.get("investor-1")?.availableCashCents).toBe(16_00)
    expect(
      activities.filter((activity) => activity.investorId === "investor-1"),
    ).toHaveLength(2)
  })

  test("withdraws available cash and rejects an excessive withdrawal", async () => {
    const { store, accounts, activities } = memoryStore()
    accounts.set("investor-1", {
      investorId: "investor-1",
      availableCashCents: 50_00,
      realizedGainLossCents: 0,
      positions: [],
    })

    expect(
      await withdrawCash(store, {
        investorId: "investor-1",
        amountCents: 20_00,
        idempotencyKey: "withdraw-1",
      }),
    ).toMatchObject({
      status: 200,
      body: { availableCashCents: 30_00 },
    })
    const rejectedCommand = {
      investorId: "investor-1",
      amountCents: 30_01,
      idempotencyKey: "withdraw-2",
    }
    const rejected = await withdrawCash(store, rejectedCommand)
    expect(rejected).toEqual({
      status: 422,
      body: {
        error: {
          code: "insufficient_cash",
          message: "Cash Withdrawal exceeds Available Cash.",
        },
      },
    })
    await depositCash(store, {
      investorId: "investor-1",
      amountCents: 1_00,
      idempotencyKey: "deposit-after-rejection",
    })
    expect(await withdrawCash(store, rejectedCommand)).toEqual(rejected)
    expect(accounts.get("investor-1")?.availableCashCents).toBe(31_00)
    expect(activities).toHaveLength(2)
  })

  test("lists bounded Account Activity newest first without persistence fields", async () => {
    const { store, activities } = memoryStore()
    await createBrokerageAccount(store, {
      investorId: "investor-1",
      startingCashCents: 10_00,
      idempotencyKey: "open",
    })
    await depositCash(store, {
      investorId: "investor-1",
      amountCents: 5_00,
      idempotencyKey: "deposit",
    })
    await withdrawCash(store, {
      investorId: "investor-1",
      amountCents: 2_00,
      idempotencyKey: "withdraw",
    })

    expect(await listAccountActivities(store, "investor-1")).toEqual({
      status: 200,
      body: {
        activities: [
          {
            type: "cash_withdrawal",
            amountCents: 2_00,
            createdAt: expect.any(String),
          },
          {
            type: "cash_deposit",
            amountCents: 5_00,
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
    for (let index = 0; index < 101; index++) {
      activities.push({
        investorId: "investor-1",
        type: "cash_deposit",
        amountCents: index + 1,
        createdAt: new Date(Date.UTC(2026, 0, 2, 0, 0, index)).toISOString(),
      })
    }
    const bounded = await listAccountActivities(store, "investor-1")
    const boundedActivities = (
      bounded.body as { activities: AccountActivity[] }
    ).activities
    expect(boundedActivities).toHaveLength(100)
    expect(boundedActivities[0]).toMatchObject({ amountCents: 101 })
    expect(boundedActivities.at(-1)).toMatchObject({ amountCents: 2 })

    expect(await listAccountActivities(store, "missing")).toMatchObject({
      status: 404,
      body: { error: { code: "not_found" } },
    })
  })

  test("reads durable account state and returns not found for an unknown Investor", async () => {
    const { store, accounts } = memoryStore()
    const account: BrokerageAccount = {
      investorId: "investor-1",
      availableCashCents: 10_00,
      realizedGainLossCents: 0,
      positions: [],
    }
    accounts.set(account.investorId, account)

    expect(await readBrokerageAccount(store, "investor-1")).toEqual({
      status: 200,
      body: account,
    })
    expect(await readBrokerageAccount(store, "missing")).toEqual({
      status: 404,
      body: {
        error: {
          code: "not_found",
          message: "Brokerage Account not found.",
        },
      },
    })
  })
})
