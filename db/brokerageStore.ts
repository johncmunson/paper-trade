import { and, eq, sql } from "drizzle-orm"
import { db } from "./index"
import {
  accountActivities,
  accounts,
  idempotencyKeys,
  positions,
} from "./schema"
import type {
  BrokerageAccount,
  BrokerageStore,
  IdempotencyRecord,
} from "../lib/brokerageService"

export const postgresBrokerageStore: BrokerageStore = {
  transaction: (work) =>
    db.transaction((transaction) =>
      work({
        lockIdempotency: async (investorId, key) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${JSON.stringify([investorId, key])}, 0))`,
          )
        },
        findIdempotency: async (investorId, key) => {
          const [record] = await transaction
            .select()
            .from(idempotencyKeys)
            .where(
              and(
                eq(idempotencyKeys.investorId, investorId),
                eq(idempotencyKeys.key, key),
              ),
            )
            .limit(1)

          if (!record) return undefined

          return {
            investorId: record.investorId,
            key: record.key,
            fingerprint: record.requestFingerprint,
            status: record.responseStatus,
            body: record.responseBody,
          } as IdempotencyRecord
        },
        insertAccount: async (account) => {
          const inserted = await transaction
            .insert(accounts)
            .values({
              investorId: account.investorId,
              availableCashCents: account.availableCashCents,
              realizedGainLossCents: account.realizedGainLossCents,
            })
            .onConflictDoNothing({ target: accounts.investorId })
            .returning({ investorId: accounts.investorId })

          return inserted.length === 1
        },
        insertStartingCashActivity: async (investorId, amountCents) => {
          await transaction.insert(accountActivities).values({
            investorId,
            type: "starting_cash",
            amountCents,
          })
        },
        insertIdempotency: async (record) => {
          await transaction.insert(idempotencyKeys).values({
            investorId: record.investorId,
            key: record.key,
            requestFingerprint: record.fingerprint,
            responseStatus: record.status,
            responseBody: record.body,
          })
        },
      }),
    ),
  findAccount: async (investorId) => {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.investorId, investorId))
      .limit(1)

    if (!account) return undefined

    const storedPositions = await db
      .select({
        ticker: positions.ticker,
        quantity: positions.quantity,
        totalCostBasisCents: positions.totalCostBasisCents,
      })
      .from(positions)
      .where(eq(positions.investorId, investorId))
      .orderBy(positions.ticker)

    return {
      investorId: account.investorId,
      availableCashCents: account.availableCashCents,
      realizedGainLossCents: account.realizedGainLossCents,
      positions: storedPositions.map((position) => ({
        ticker: position.ticker,
        quantity: position.quantity,
        averageCostBasisCents: Math.round(
          position.totalCostBasisCents / position.quantity,
        ),
      })),
    } satisfies BrokerageAccount
  },
}
