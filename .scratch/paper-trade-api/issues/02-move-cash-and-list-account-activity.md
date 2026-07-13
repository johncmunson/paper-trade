# 02 — Move cash and list Account Activity

**What to build:** Let Wealth Manager immediately deposit and withdraw simulated USD cash while preserving explainable, immutable Account Activity and preventing concurrent requests from making Available Cash invalid.

**Blocked by:** 01 — Open and inspect a Brokerage Account

**Status:** ready-for-agent

- [ ] `POST /api/investors/{investorId}/account/deposits` accepts a positive safe-integer `amountCents`, requires an idempotency key, and immediately increases Available Cash.
- [ ] `POST /api/investors/{investorId}/account/withdrawals` accepts a positive safe-integer `amountCents`, requires an idempotency key, and immediately decreases Available Cash.
- [ ] A Cash Withdrawal greater than Available Cash returns the agreed `422` domain error and changes neither account state nor Account Activity.
- [ ] Cash movements for an unknown Investor return `404`; malformed, zero, negative, fractional, or unsafe amounts return `400`.
- [ ] Each successful Cash Deposit or Cash Withdrawal atomically updates Available Cash, appends immutable Account Activity, and stores its terminal idempotency response.
- [ ] Repeating the same key and payload returns the original response, while conflicting key reuse returns `409` without another cash movement.
- [ ] Mutations lock and re-check the Brokerage Account inside the database transaction so concurrent withdrawals cannot produce negative Available Cash.
- [ ] `GET /api/investors/{investorId}/account/activities` returns a bounded, newest-first history containing account opening, Cash Deposits, and Cash Withdrawals.
- [ ] Account Activity responses use integer-cent money fields and stable activity types without exposing persistence details.
- [ ] Unit tests cover deposits, withdrawals, validation, insufficient cash, idempotency replay/conflict, and error results using the application-service seam.
- [ ] Live-database integration tests verify the full cash lifecycle, immutable history, rollback on rejection, and at least one concurrent mutation scenario.
- [ ] README documentation includes cash movement and Account Activity contracts with representative success and failure examples.
