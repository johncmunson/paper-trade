# Financial Datasets testing

Automated tests must never call the live Financial Datasets API.

- Test the HTTP wrapper with MSW. Add handlers beside each wrapper test with `server.use(...)`; do not create a global handler catalog until handlers are genuinely reused.
- Test application services with a small fake wrapper function and deterministic fixtures. Do not make service tests depend on HTTP interception.
- Test persistence with the live test database and the same fake wrapper boundary. MSW does not mock the database.

`test/unitSetup.ts` owns the MSW lifecycle, resets runtime handlers after each test, and rejects unhandled requests. Handlers should return errors for invalid query parameters or authentication rather than tests asserting intercepted request details.

```ts
server.use(
  http.get("https://api.financialdatasets.ai/prices/snapshot", () =>
    HttpResponse.json({ snapshot: quoteFixture }),
  ),
)
```
