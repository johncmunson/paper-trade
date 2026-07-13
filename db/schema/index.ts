import { sql } from "drizzle-orm"
import {
  bigint,
  check,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const accounts = pgTable(
  "accounts",
  {
    investorId: text().primaryKey(),
    availableCashCents: bigint({ mode: "number" }).notNull(),
    realizedGainLossCents: bigint({ mode: "number" }).notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "accounts_available_cash_non_negative",
      sql`${table.availableCashCents} >= 0`,
    ),
  ],
)

export const positions = pgTable(
  "positions",
  {
    investorId: text()
      .notNull()
      .references(() => accounts.investorId, { onDelete: "cascade" }),
    ticker: text().notNull(),
    quantity: bigint({ mode: "number" }).notNull(),
    totalCostBasisCents: bigint({ mode: "number" }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.investorId, table.ticker] }),
    check(
      "positions_ticker_canonical",
      sql`${table.ticker} <> '' and ${table.ticker} = upper(btrim(${table.ticker}))`,
    ),
    check("positions_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "positions_cost_basis_non_negative",
      sql`${table.totalCostBasisCents} >= 0`,
    ),
  ],
)

export const accountActivities = pgTable(
  "account_activities",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    investorId: text()
      .notNull()
      .references(() => accounts.investorId, { onDelete: "restrict" }),
    type: text().notNull(),
    amountCents: bigint({ mode: "number" }),
    ticker: text(),
    quantity: bigint({ mode: "number" }),
    priceCents: bigint({ mode: "number" }),
    totalCents: bigint({ mode: "number" }),
    costBasisCents: bigint({ mode: "number" }),
    realizedGainLossCents: bigint({ mode: "number" }),
    quoteTimestamp: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "account_activities_type_valid",
      sql`${table.type} in ('starting_cash', 'cash_deposit', 'cash_withdrawal', 'buy_fill', 'sell_fill')`,
    ),
    check(
      "account_activities_amount_non_negative",
      sql`${table.amountCents} is null or ${table.amountCents} >= 0`,
    ),
    check(
      "account_activities_ticker_canonical",
      sql`${table.ticker} is null or (${table.ticker} <> '' and ${table.ticker} = upper(btrim(${table.ticker})))`,
    ),
    check(
      "account_activities_quantity_positive",
      sql`${table.quantity} is null or ${table.quantity} > 0`,
    ),
    check(
      "account_activities_price_positive",
      sql`${table.priceCents} is null or ${table.priceCents} > 0`,
    ),
    check(
      "account_activities_total_non_negative",
      sql`${table.totalCents} is null or ${table.totalCents} >= 0`,
    ),
    check(
      "account_activities_cost_basis_non_negative",
      sql`${table.costBasisCents} is null or ${table.costBasisCents} >= 0`,
    ),
  ],
)

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    investorId: text()
      .notNull()
      .references(() => accounts.investorId, { onDelete: "restrict" }),
    key: text().notNull(),
    requestFingerprint: text().notNull(),
    responseStatus: integer().notNull(),
    responseBody: jsonb().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.investorId, table.key] }),
    check(
      "idempotency_keys_response_status_valid",
      sql`${table.responseStatus} between 100 and 599`,
    ),
  ],
)
