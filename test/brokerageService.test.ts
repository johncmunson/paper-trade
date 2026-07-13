import { describe, expect, test } from "vitest"
import {
  createBrokerageAccount,
  readBrokerageAccount,
  type BrokerageAccount,
  type BrokerageStore,
  type IdempotencyRecord,
} from "../lib/brokerageService"

function memoryStore() {
  const accounts = new Map<string, BrokerageAccount>()
  const activities: Array<{ investorId: string; amountCents: number }> = []
  const idempotency = new Map<string, IdempotencyRecord>()

  const store: BrokerageStore = {
    transaction: async (work) =>
      work({
        lockIdempotency: async () => {},
        findIdempotency: async (investorId, key) =>
          idempotency.get(`${investorId}:${key}`),
        insertAccount: async (account) => {
          if (accounts.has(account.investorId)) return false
          accounts.set(account.investorId, account)
          return true
        },
        insertStartingCashActivity: async (investorId, amountCents) => {
          activities.push({ investorId, amountCents })
        },
        insertIdempotency: async (record) => {
          idempotency.set(`${record.investorId}:${record.key}`, record)
        },
      }),
    findAccount: async (investorId) => accounts.get(investorId),
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
    expect(activities).toEqual([
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
