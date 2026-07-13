# 01 — Open and inspect a Brokerage Account

**What to build:** Establish Paper Trade as an authenticated API-only service and let Wealth Manager idempotently create and read one Brokerage Account for an Investor, including caller-specified starting cash and the initial Account Activity.

**Blocked by:** None — can start immediately

**Status:** resolved

- [ ] The generated frontend and unused public assets are removed; the project builds and runs as an API-only Next.js service.
- [ ] A shared server-side bearer credential protects every delivered endpoint, and missing or invalid credentials return the agreed `401` JSON error without exposing secrets.
- [ ] `POST /api/investors/{investorId}/account` accepts a non-negative safe-integer `startingCashCents` and requires an `Idempotency-Key` header.
- [ ] Successful account creation returns the Investor identifier, Available Cash, zero Realized Gain or Loss, and an empty Position collection.
- [ ] Account creation atomically persists the Brokerage Account, its starting-cash Account Activity, and the terminal idempotency result.
- [ ] Retrying account creation with the same idempotency key and payload returns the original status and body; reusing the key with a different payload returns `409`.
- [ ] Attempting to create a second Brokerage Account for the same Investor with a new key returns `409` and leaves existing state unchanged.
- [ ] `GET /api/investors/{investorId}/account` returns durable account state without fetching market data; an unknown Investor returns `404`.
- [ ] The final persistence model is represented by accounts, positions, account activities, and idempotency keys only, with database constraints protecting account and Position uniqueness and non-negative stored state.
- [ ] Route Handlers remain thin adapters over one application-service seam used by tests.
- [ ] Vitest unit tests exercise this seam with mocked database and Financial Datasets boundaries.
- [ ] Integration tests use a live dedicated test database, run migrations, clean application tables, and verify creation, replay, conflict, and read behavior through the same application-service seam.
- [ ] Integration tests fail before cleanup if `TEST_DATABASE_URL` is missing or equals `DATABASE_URL`.
- [ ] README documentation explains environment setup, migrations, service authentication, test commands, idempotency, and the account endpoints.
