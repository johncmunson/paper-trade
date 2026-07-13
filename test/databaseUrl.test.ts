import { expect, test } from "vitest"
import { getDatabaseUrl } from "../lib/databaseUrl"
import { assertSafeTestDatabase } from "../lib/testDatabase"

test("selects only the current environment's database URLs", () => {
  const originalEnv = process.env

  try {
    process.env = { NODE_ENV: "development", DATABASE_URL: "development" }
    expect(getDatabaseUrl()).toBe("development")

    process.env = {
      NODE_ENV: "test",
      TEST_DATABASE_URL: "test",
      TEST_DATABASE_URL_UNPOOLED: "test-unpooled",
    }
    expect(getDatabaseUrl()).toBe("test")
    expect(getDatabaseUrl({ preferUnpooled: true })).toBe("test-unpooled")

    process.env = {
      NODE_ENV: "production",
      PRODUCTION_DATABASE_URL: "production",
    }
    expect(getDatabaseUrl()).toBe("production")

    process.env = {
      NODE_ENV: "production",
      APP_ENV: "staging",
      STAGING_DATABASE_URL: "staging",
    }
    expect(getDatabaseUrl()).toBe("staging")

    process.env = {
      NODE_ENV: "development",
      TEST_DATABASE_URL_UNPOOLED: "wrong",
    }
    expect(getDatabaseUrl).toThrow(
      /TEST_DATABASE_URL_UNPOOLED may only be set in the test/,
    )
  } finally {
    process.env = originalEnv
  }
})

test("refuses missing or shared integration test databases", () => {
  expect(() => assertSafeTestDatabase({})).toThrow(
    /TEST_DATABASE_URL must be set/,
  )
  expect(() =>
    assertSafeTestDatabase({
      TEST_DATABASE_URL: "postgres://shared",
      DATABASE_URL: "postgres://shared",
    }),
  ).toThrow(/must not equal DATABASE_URL/)
  expect(() =>
    assertSafeTestDatabase({
      TEST_DATABASE_URL: "postgres://test",
      DATABASE_URL: "postgres://development",
    }),
  ).not.toThrow()
})
