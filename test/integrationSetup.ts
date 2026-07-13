import { readFileSync } from "node:fs"
import { parseEnv } from "node:util"
import { afterAll, beforeAll, beforeEach } from "vitest"
import "../lib/envConfig"
import { assertSafeTestDatabase } from "../lib/testDatabase"

let localDatabaseUrl: string | undefined
try {
  localDatabaseUrl = parseEnv(readFileSync(".env.local", "utf8")).DATABASE_URL
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
}

assertSafeTestDatabase({
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? localDatabaseUrl,
})

let database: typeof import("../db")

beforeAll(async () => {
  database = await import("../db")
  const { migrate } = await import("drizzle-orm/node-postgres/migrator")
  await migrate(database.db, { migrationsFolder: "db/migrations" })
})

beforeEach(async () => {
  await database.pool.query(
    "truncate table idempotency_keys, account_activities, positions, accounts restart identity cascade",
  )
})

afterAll(async () => {
  await database.pool.end()
})
