export function assertSafeTestDatabase(
  environment: Record<string, string | undefined>,
) {
  if (!environment.TEST_DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL must be set before integration test cleanup.",
    )
  }

  if (environment.TEST_DATABASE_URL === environment.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must not equal DATABASE_URL.")
  }
}
