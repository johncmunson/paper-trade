import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "./index"
import {
  accountActivities,
  accounts,
  idempotencyKeys,
  positions,
} from "./schema"
import type {
  AccountActivity,
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
        lockAccount: async (investorId) => {
          const [account] = await transaction
            .select()
            .from(accounts)
            .where(eq(accounts.investorId, investorId))
            .limit(1)
            .for("update")

          if (!account) return undefined

          const storedPositions = await transaction
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
          }
        },
        updateAvailableCash: async (investorId, availableCashCents) => {
          await transaction
            .update(accounts)
            .set({ availableCashCents })
            .where(eq(accounts.investorId, investorId))
        },
        insertCashActivity: async (investorId, type, amountCents) => {
          await transaction.insert(accountActivities).values({
            investorId,
            type,
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
  findActivities: async (investorId, limit) => {
    const activities = await db
      .select()
      .from(accountActivities)
      .where(eq(accountActivities.investorId, investorId))
      .orderBy(desc(accountActivities.createdAt), desc(accountActivities.id))
      .limit(limit)

    return activities.map((activity): AccountActivity => {
      const createdAt = activity.createdAt.toISOString()
      if (
        activity.type === "starting_cash" ||
        activity.type === "cash_deposit" ||
        activity.type === "cash_withdrawal"
      ) {
        return {
          type: activity.type,
          amountCents: activity.amountCents as number,
          createdAt,
        }
      }
      if (activity.type === "buy_fill") {
        return {
          type: activity.type,
          ticker: activity.ticker as string,
          quantity: activity.quantity as number,
          priceCents: activity.priceCents as number,
          totalCents: activity.totalCents as number,
          quoteTimestamp: (activity.quoteTimestamp as Date).toISOString(),
          createdAt,
        }
      }
      if (activity.type === "sell_fill") {
        return {
          type: activity.type,
          ticker: activity.ticker as string,
          quantity: activity.quantity as number,
          priceCents: activity.priceCents as number,
          totalCents: activity.totalCents as number,
          costBasisCents: activity.costBasisCents as number,
          realizedGainLossCents: activity.realizedGainLossCents as number,
          quoteTimestamp: (activity.quoteTimestamp as Date).toISOString(),
          createdAt,
        }
      }
      throw new Error("Unsupported Account Activity type")
    })
  },
}
