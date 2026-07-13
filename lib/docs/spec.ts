/**
 * Structured, presentation-ready model of the Paper Trade API.
 *
 * This mirrors `openapi.yaml` at the repo root, which is the source of truth.
 * It is hand-derived so the reference site can render precise, well-organized
 * content without a runtime OpenAPI dereferencer.
 */

export type HttpMethod = "GET" | "HEAD" | "POST" | "OPTIONS"

export interface ApiParam {
  name: string
  location: "path" | "query" | "header"
  required: boolean
  type: string
  description: string
  example?: string
}

export interface ApiExample {
  label: string
  code: string
}

export interface ApiRequestBody {
  description: string
  contentType: string
  examples: ApiExample[]
}

export interface ApiResponse {
  status: string
  kind: "2xx" | "4xx" | "5xx"
  description: string
  example?: string
}

export interface ApiOperation {
  id: string
  method: HttpMethod
  path: string
  summary: string
  description: string
  auth: boolean
  auxiliary?: boolean
  params: ApiParam[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
}

export interface ApiGroup {
  id: string
  tag: string
  description: string
  operations: ApiOperation[]
}

export interface GuideSection {
  id: string
  title: string
  body: string[]
  callout?: { tone: "info" | "warn"; text: string }
  code?: { label: string; code: string }
}

export interface SchemaField {
  name: string
  type: string
  required: boolean
  description: string
}

export interface SchemaDef {
  id: string
  name: string
  description: string
  fields?: SchemaField[]
  variants?: string[]
  note?: string
}

export interface ErrorCode {
  code: string
  status: string
  message: string
  where: string
}

export const apiInfo = {
  title: "Paper Trade API",
  version: "1.0.0",
  summary: "Private API for simulated brokerage accounts and market data.",
  description:
    "Paper Trade maintains one simulated Brokerage Account per Wealth Manager Investor and exposes on-demand Tradable Security data.",
  baseUrl: "{scheme}://{host}",
  defaultHost: "localhost:3000",
}

export const guides: GuideSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: [
      "Paper Trade is a private, API-only service that maintains exactly one simulated Brokerage Account per Wealth Manager Investor and exposes on-demand Tradable Security data.",
      "Every business operation is authenticated with an opaque shared service credential. The reference below documents each resource, its supported methods, request shapes, and the full set of success and error responses.",
    ],
    callout: {
      tone: "info",
      text: "All monetary fields ending in Cents are integer cents. Share quantities are positive whole shares. Request values are restricted to JavaScript safe integers where stated.",
    },
  },
  {
    id: "authentication",
    title: "Authentication",
    body: [
      "All business operations require the opaque shared service credential passed in an Authorization: Bearer <credential> header. The credential is not a JWT — it is an opaque shared secret configured server-side as PAPER_TRADE_SERVICE_CREDENTIAL.",
      "OPTIONS and unsupported-method responses do not authenticate. A missing, malformed, or incorrect credential returns 401 unauthorized.",
    ],
    code: {
      label: "Authorization header",
      code: "Authorization: Bearer <credential>",
    },
    callout: {
      tone: "warn",
      text: "Keep the credential server-side. It grants full access to every Investor account and should never be exposed to browser code.",
    },
  },
  {
    id: "idempotency",
    title: "Idempotency",
    body: [
      "Every account mutation requires an Idempotency-Key header. Keys are scoped to the exact Investor and retained with terminal results.",
      "Repeating the same key with a normalized-identical request replays the original status and body. Reusing the same key for a different request returns 409 idempotency_conflict.",
      "Additional properties on mutation bodies are accepted, ignored, and excluded from the idempotency fingerprint.",
    ],
    code: {
      label: "Idempotency header",
      code: "Idempotency-Key: deposit-investor-123-1",
    },
  },
  {
    id: "method-handling",
    title: "Method handling",
    body: [
      "Documented HEAD operations are provided by Next.js by invoking GET and suppressing the body.",
      'Unsupported exported methods return 405 with {"error":{"code":"method_not_allowed","message":"Method not allowed."}} and the same Allow value shown by the path\u2019s OPTIONS operation. These rejecting methods are intentionally omitted as OpenAPI operations.',
      "OPTIONS responses expose Allow only; they are not complete CORS preflight responses and emit no Access-Control-Allow-* headers.",
    ],
    code: {
      label: "405 response body",
      code: `{
  "error": {
    "code": "method_not_allowed",
    "message": "Method not allowed."
  }
}`,
    },
  },
]

const unauthorized: ApiResponse = {
  status: "401",
  kind: "4xx",
  description: "Bearer credential is missing, malformed, or incorrect.",
  example: `{
  "error": {
    "code": "unauthorized",
    "message": "A valid bearer credential is required."
  }
}`,
}

const internalError: ApiResponse = {
  status: "500",
  kind: "5xx",
  description:
    "The route caught an unexpected failure, including missing credential configuration and database failures.",
  example: `{
  "error": {
    "code": "internal_error",
    "message": "The request could not be completed."
  }
}`,
}

const accountNotFound: ApiResponse = {
  status: "404",
  kind: "4xx",
  description: "No Brokerage Account exists for the exact Investor ID.",
  example: `{
  "error": {
    "code": "not_found",
    "message": "Brokerage Account not found."
  }
}`,
}

const marketDataUnavailable: ApiResponse = {
  status: "503",
  kind: "5xx",
  description:
    "Provider credentials, timeout, transport, status, JSON, or returned data were unavailable or unusable. Provider details are not exposed.",
  example: `{
  "error": {
    "code": "market_data_unavailable",
    "message": "Market data is temporarily unavailable."
  }
}`,
}

const unsupportedTicker: ApiResponse = {
  status: "422",
  kind: "4xx",
  description:
    "Provider returned not-found, or facts identify an inactive security or a listing outside the accepted exchange set.",
  example: `{
  "error": {
    "code": "unsupported_ticker",
    "message": "Ticker is not a supported active US-listed stock or ETF."
  }
}`,
}

const invalidTicker: ApiResponse = {
  status: "400",
  kind: "4xx",
  description: "Ticker is malformed after trimming and uppercasing.",
  example: `{
  "error": {
    "code": "invalid_request",
    "message": "Ticker is malformed."
  }
}`,
}

const idempotencyConflict: ApiResponse = {
  status: "409",
  kind: "4xx",
  description:
    "The Investor-scoped key was already used with a different normalized request.",
  example: `{
  "error": {
    "code": "idempotency_conflict",
    "message": "Idempotency key was already used with a different request."
  }
}`,
}

const investorIdParam: ApiParam = {
  name: "investorId",
  location: "path",
  required: true,
  type: "string",
  description:
    "Exact, opaque Investor identifier. The application does not trim, normalize, length-limit, or pattern-check this value.",
  example: "investor-123",
}

const tickerParam: ApiParam = {
  name: "ticker",
  location: "path",
  required: true,
  type: "string",
  description:
    "Ticker input. Trimmed and uppercased, then required to be 1\u201310 ASCII characters matching ^[A-Z][A-Z0-9.-]{0,9}$. Lowercase and surrounding whitespace are accepted.",
  example: "AAPL",
}

const idempotencyKeyParam: ApiParam = {
  name: "Idempotency-Key",
  location: "header",
  required: true,
  type: "string",
  description:
    "Investor-scoped mutation key containing at least one non-whitespace character. The original value is retained as the key; no maximum length is enforced.",
  example: "deposit-investor-123-1",
}

export const groups: ApiGroup[] = [
  {
    id: "brokerage-accounts",
    tag: "Brokerage Accounts",
    description:
      "Brokerage Account lifecycle, balances, Positions, and Account Activity.",
    operations: [
      {
        id: "getBrokerageAccount",
        method: "GET",
        path: "/api/investors/{investorId}/account",
        summary: "Get a Brokerage Account",
        description:
          "Returns durable cash, cumulative Realized Gain or Loss, and Positions. No market data is requested. Positions are ordered by Ticker ascending.",
        auth: true,
        params: [investorIdParam],
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "Brokerage Account found.",
            example: `{
  "investorId": "investor-123",
  "availableCashCents": 1000000,
  "realizedGainLossCents": 0,
  "positions": []
}`,
          },
          unauthorized,
          accountNotFound,
          internalError,
        ],
      },
      {
        id: "createBrokerageAccount",
        method: "POST",
        path: "/api/investors/{investorId}/account",
        summary: "Create a Brokerage Account",
        description:
          "Creates the account and its starting_cash Account Activity atomically. One account is allowed per exact Investor ID. An exact idempotent replay returns the original 201 body and does not create another activity.",
        auth: true,
        params: [investorIdParam, idempotencyKeyParam],
        requestBody: {
          description: "Starting cash for the new account, in integer cents.",
          contentType: "application/json",
          examples: [
            { label: "Standard", code: `{
  "startingCashCents": 1000000
}` },
            { label: "Zero balance", code: `{
  "startingCashCents": 0
}` },
          ],
        },
        responses: [
          {
            status: "201",
            kind: "2xx",
            description:
              "Account created, or the original successful result replayed.",
            example: `{
  "investorId": "investor-123",
  "availableCashCents": 1000000,
  "realizedGainLossCents": 0,
  "positions": []
}`,
          },
          {
            status: "400",
            kind: "4xx",
            description: "Body or Idempotency-Key is missing, malformed, or invalid.",
            example: `{
  "error": {
    "code": "invalid_request",
    "message": "startingCashCents must be a non-negative safe integer and Idempotency-Key is required."
  }
}`,
          },
          unauthorized,
          {
            status: "409",
            kind: "4xx",
            description:
              "The idempotency key conflicts, or the Investor already has an account.",
            example: `{
  "error": {
    "code": "account_already_exists",
    "message": "A Brokerage Account already exists for this Investor."
  }
}`,
          },
          internalError,
        ],
      },
      {
        id: "headBrokerageAccount",
        method: "HEAD",
        path: "/api/investors/{investorId}/account",
        summary: "Check for a Brokerage Account",
        description:
          "Runs the GET operation, including authentication and database reads, but returns no body.",
        auth: true,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "200", kind: "2xx", description: "Brokerage Account found; body omitted." },
          { status: "401", kind: "4xx", description: "Bearer credential is missing or invalid; body omitted." },
          { status: "404", kind: "4xx", description: "Brokerage Account not found; body omitted." },
          { status: "500", kind: "5xx", description: "The request could not be completed; body omitted." },
        ],
      },
      {
        id: "optionsBrokerageAccount",
        method: "OPTIONS",
        path: "/api/investors/{investorId}/account",
        summary: "List supported account methods",
        description:
          "Returns Allow: GET, HEAD, OPTIONS, POST. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: GET, HEAD, OPTIONS, POST." },
        ],
      },
      {
        id: "depositCash",
        method: "POST",
        path: "/api/investors/{investorId}/account/deposits",
        summary: "Deposit cash",
        description:
          "Adds cash and records one cash_deposit Account Activity atomically. A successful exact replay returns the original account snapshot without moving cash again. A terminal 404 or 422 is also retained for replay. Allow: OPTIONS, POST.",
        auth: true,
        params: [investorIdParam, idempotencyKeyParam],
        requestBody: {
          description: "Cash amount to deposit, in positive integer cents.",
          contentType: "application/json",
          examples: [{ label: "Standard", code: `{
  "amountCents": 25000
}` }],
        },
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "Deposit committed, or the original successful result replayed.",
            example: `{
  "investorId": "investor-123",
  "availableCashCents": 1025000,
  "realizedGainLossCents": 0,
  "positions": []
}`,
          },
          {
            status: "400",
            kind: "4xx",
            description: "Body, amount, or Idempotency-Key is missing, malformed, or invalid.",
            example: `{
  "error": {
    "code": "invalid_request",
    "message": "amountCents must be a positive safe integer and Idempotency-Key is required."
  }
}`,
          },
          unauthorized,
          accountNotFound,
          idempotencyConflict,
          {
            status: "422",
            kind: "4xx",
            description: "The deposit would make Available Cash exceed the supported safe-integer limit.",
            example: `{
  "error": {
    "code": "cash_limit_exceeded",
    "message": "Cash Deposit would exceed the supported cash limit."
  }
}`,
          },
          internalError,
        ],
      },
      {
        id: "optionsCashDeposits",
        method: "OPTIONS",
        path: "/api/investors/{investorId}/account/deposits",
        summary: "List supported deposit methods",
        description: "Returns Allow: OPTIONS, POST. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: OPTIONS, POST." },
        ],
      },
      {
        id: "withdrawCash",
        method: "POST",
        path: "/api/investors/{investorId}/account/withdrawals",
        summary: "Withdraw cash",
        description:
          "Subtracts cash and records one cash_withdrawal Account Activity atomically. Withdrawing the entire Available Cash balance is allowed. Concurrent withdrawals are serialized and cannot overdraw the account. Allow: OPTIONS, POST.",
        auth: true,
        params: [investorIdParam, idempotencyKeyParam],
        requestBody: {
          description: "Cash amount to withdraw, in positive integer cents.",
          contentType: "application/json",
          examples: [{ label: "Standard", code: `{
  "amountCents": 25000
}` }],
        },
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "Withdrawal committed, or the original successful result replayed.",
            example: `{
  "investorId": "investor-123",
  "availableCashCents": 970000,
  "realizedGainLossCents": 0,
  "positions": []
}`,
          },
          {
            status: "400",
            kind: "4xx",
            description: "Body, amount, or Idempotency-Key is missing, malformed, or invalid.",
            example: `{
  "error": {
    "code": "invalid_request",
    "message": "amountCents must be a positive safe integer and Idempotency-Key is required."
  }
}`,
          },
          unauthorized,
          accountNotFound,
          idempotencyConflict,
          {
            status: "422",
            kind: "4xx",
            description: "The withdrawal exceeds currently locked Available Cash.",
            example: `{
  "error": {
    "code": "insufficient_cash",
    "message": "Cash Withdrawal exceeds Available Cash."
  }
}`,
          },
          internalError,
        ],
      },
      {
        id: "optionsCashWithdrawals",
        method: "OPTIONS",
        path: "/api/investors/{investorId}/account/withdrawals",
        summary: "List supported withdrawal methods",
        description: "Returns Allow: OPTIONS, POST. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: OPTIONS, POST." },
        ],
      },
      {
        id: "listAccountActivities",
        method: "GET",
        path: "/api/investors/{investorId}/account/activities",
        summary: "List Account Activity",
        description:
          "Returns at most 100 activities, newest first. Equal timestamps are ordered by the internal activity identifier descending. There is no pagination, filtering, or caller-selectable limit. Allow: GET, HEAD, OPTIONS.",
        auth: true,
        params: [investorIdParam],
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "Account exists; its activity history is returned.",
            example: `{
  "activities": [
    {
      "type": "cash_withdrawal",
      "amountCents": 30000,
      "createdAt": "2026-07-13T12:02:00.000Z"
    },
    {
      "type": "cash_deposit",
      "amountCents": 25000,
      "createdAt": "2026-07-13T12:01:00.000Z"
    },
    {
      "type": "starting_cash",
      "amountCents": 1000000,
      "createdAt": "2026-07-13T12:00:00.000Z"
    }
  ]
}`,
          },
          unauthorized,
          accountNotFound,
          internalError,
        ],
      },
      {
        id: "headAccountActivities",
        method: "HEAD",
        path: "/api/investors/{investorId}/account/activities",
        summary: "Check Account Activity availability",
        description: "Runs the GET operation, including database reads, but returns no body.",
        auth: true,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "200", kind: "2xx", description: "Account exists; body omitted." },
          { status: "401", kind: "4xx", description: "Bearer credential is missing or invalid; body omitted." },
          { status: "404", kind: "4xx", description: "Brokerage Account not found; body omitted." },
          { status: "500", kind: "5xx", description: "The request could not be completed; body omitted." },
        ],
      },
      {
        id: "optionsAccountActivities",
        method: "OPTIONS",
        path: "/api/investors/{investorId}/account/activities",
        summary: "List supported activity methods",
        description: "Returns Allow: GET, HEAD, OPTIONS. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: GET, HEAD, OPTIONS." },
        ],
      },
    ],
  },
  {
    id: "market-orders",
    tag: "Market Orders",
    description: "Synchronous simulated Buy and Sell fills.",
    operations: [
      {
        id: "placeMarketOrder",
        method: "POST",
        path: "/api/investors/{investorId}/account/market-orders",
        summary: "Execute a Buy or Sell Market Order",
        description:
          "Executes synchronously against a freshly fetched quote and returns an immutable Fill; no Market Order resource is persisted. Tickers are trimmed and uppercased before validation. The simplified session is Monday\u2013Friday, 09:30 inclusive to 16:00 exclusive in America/New_York; holidays and early closes are ignored. Facts and quote data are fetched before account lookup, so an unknown Investor can receive market-session, security, or provider errors before 404. Matching idempotent replays occur before those checks. Allow: OPTIONS, POST.",
        auth: true,
        params: [investorIdParam, idempotencyKeyParam],
        requestBody: {
          description:
            "Order side, ticker (trimmed and uppercased before validation), and positive whole-share quantity.",
          contentType: "application/json",
          examples: [
            { label: "Buy", code: `{
  "side": "buy",
  "ticker": " aapl ",
  "quantity": 2
}` },
            { label: "Sell", code: `{
  "side": "sell",
  "ticker": "aapl",
  "quantity": 1
}` },
          ],
        },
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "The order filled, or the original Fill was replayed.",
            example: `{
  "type": "buy_fill",
  "ticker": "AAPL",
  "quantity": 2,
  "priceCents": 21134,
  "totalCents": 42268,
  "quoteTimestamp": "2026-07-13T14:30:00.000Z"
}`,
          },
          {
            status: "400",
            kind: "4xx",
            description: "Body, order fields, or Idempotency-Key is missing, malformed, or invalid.",
            example: `{
  "error": {
    "code": "invalid_request",
    "message": "side must be \\"buy\\" or \\"sell\\", Ticker must be valid, quantity must be a positive safe whole number, and Idempotency-Key is required."
  }
}`,
          },
          unauthorized,
          accountNotFound,
          idempotencyConflict,
          {
            status: "422",
            kind: "4xx",
            description:
              "A terminal domain rule rejected the order: market_closed, unsupported_ticker, insufficient_cash, position_limit_exceeded, insufficient_shares, or account_limit_exceeded.",
            example: `{
  "error": {
    "code": "insufficient_cash",
    "message": "Buy Market Order exceeds Available Cash."
  }
}`,
          },
          internalError,
          marketDataUnavailable,
        ],
      },
      {
        id: "optionsMarketOrders",
        method: "OPTIONS",
        path: "/api/investors/{investorId}/account/market-orders",
        summary: "List supported Market Order methods",
        description: "Returns Allow: OPTIONS, POST. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [investorIdParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: OPTIONS, POST." },
        ],
      },
    ],
  },
  {
    id: "tradable-securities",
    tag: "Tradable Securities",
    description: "On-demand security facts, quotes, and daily price history.",
    operations: [
      {
        id: "getTradableSecurity",
        method: "GET",
        path: "/api/securities/{ticker}",
        summary: "Look up a Tradable Security",
        description:
          "Performs an exact lookup after trimming and uppercasing the Ticker. There is no fuzzy search or alias matching. The provider request is not cached. Returned name and exchange are trimmed; exchange casing is provider-controlled. Allow: GET, HEAD, OPTIONS.",
        auth: true,
        params: [tickerParam],
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "An active security on an accepted US exchange was found.",
            example: `{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NASDAQ"
}`,
          },
          invalidTicker,
          unauthorized,
          unsupportedTicker,
          internalError,
          marketDataUnavailable,
        ],
      },
      {
        id: "headTradableSecurity",
        method: "HEAD",
        path: "/api/securities/{ticker}",
        summary: "Check Tradable Security availability",
        description: "Runs the GET operation, including its provider request, but returns no body.",
        auth: true,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "200", kind: "2xx", description: "Tradable Security found; body omitted." },
          { status: "400", kind: "4xx", description: "Ticker is malformed; body omitted." },
          { status: "401", kind: "4xx", description: "Bearer credential is missing or invalid; body omitted." },
          { status: "422", kind: "4xx", description: "Ticker is unsupported; body omitted." },
          { status: "500", kind: "5xx", description: "The request could not be completed; body omitted." },
          { status: "503", kind: "5xx", description: "Market data is unavailable; body omitted." },
        ],
      },
      {
        id: "optionsTradableSecurity",
        method: "OPTIONS",
        path: "/api/securities/{ticker}",
        summary: "List supported security lookup methods",
        description: "Returns Allow: GET, HEAD, OPTIONS. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: GET, HEAD, OPTIONS." },
        ],
      },
      {
        id: "getSecurityQuote",
        method: "GET",
        path: "/api/securities/{ticker}/quote",
        summary: "Get a current quote",
        description:
          "Fetches a non-cached provider snapshot. Price is rounded to the nearest cent. This endpoint does not fetch company facts, so it does not itself verify active status, exchange, or asset class. Allow: GET, HEAD, OPTIONS.",
        auth: true,
        params: [tickerParam],
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "A usable quote was returned by the provider.",
            example: `{
  "ticker": "AAPL",
  "priceCents": 21134,
  "quoteTimestamp": "2026-07-13T14:30:00.000Z"
}`,
          },
          invalidTicker,
          unauthorized,
          unsupportedTicker,
          internalError,
          marketDataUnavailable,
        ],
      },
      {
        id: "headSecurityQuote",
        method: "HEAD",
        path: "/api/securities/{ticker}/quote",
        summary: "Check quote availability",
        description: "Runs the GET operation, including its provider request, but returns no body.",
        auth: true,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "200", kind: "2xx", description: "Quote available; body omitted." },
          { status: "400", kind: "4xx", description: "Ticker is malformed; body omitted." },
          { status: "401", kind: "4xx", description: "Bearer credential is missing or invalid; body omitted." },
          { status: "422", kind: "4xx", description: "Ticker is unsupported; body omitted." },
          { status: "500", kind: "5xx", description: "The request could not be completed; body omitted." },
          { status: "503", kind: "5xx", description: "Market data is unavailable; body omitted." },
        ],
      },
      {
        id: "optionsSecurityQuote",
        method: "OPTIONS",
        path: "/api/securities/{ticker}/quote",
        summary: "List supported quote methods",
        description: "Returns Allow: GET, HEAD, OPTIONS. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: GET, HEAD, OPTIONS." },
        ],
      },
      {
        id: "getDailyHistoricalPrices",
        method: "GET",
        path: "/api/securities/{ticker}/prices",
        summary: "Get daily historical prices",
        description:
          "Returns provider daily OHLCV rows in the requested inclusive date range. startDate must be no later than endDate. Rows are not sorted, deduplicated, synthesized, or filled; provider order is preserved and an empty array is valid. One malformed or out-of-range provider row rejects the entire response as 503. Allow: GET, HEAD, OPTIONS.",
        auth: true,
        params: [
          tickerParam,
          {
            name: "startDate",
            location: "query",
            required: true,
            type: "string (date)",
            description: "Inclusive first calendar date. Must be no later than endDate.",
            example: "2026-01-02",
          },
          {
            name: "endDate",
            location: "query",
            required: true,
            type: "string (date)",
            description: "Inclusive last calendar date. Must be no earlier than startDate.",
            example: "2026-01-05",
          },
        ],
        responses: [
          {
            status: "200",
            kind: "2xx",
            description: "Historical rows returned; the list may be empty.",
            example: `{
  "ticker": "AAPL",
  "prices": [
    {
      "date": "2026-01-02",
      "openCents": 24385,
      "highCents": 24415,
      "lowCents": 24191,
      "closeCents": 24336,
      "volume": 40230800
    }
  ]
}`,
          },
          {
            status: "400",
            kind: "4xx",
            description: "Ticker or inclusive date range is invalid.",
            example: `{
  "error": {
    "code": "invalid_request",
    "message": "startDate and endDate must be valid YYYY-MM-DD dates in chronological order."
  }
}`,
          },
          unauthorized,
          unsupportedTicker,
          internalError,
          marketDataUnavailable,
        ],
      },
      {
        id: "headDailyHistoricalPrices",
        method: "HEAD",
        path: "/api/securities/{ticker}/prices",
        summary: "Check historical-price availability",
        description: "Runs the GET operation, including provider requests, but returns no body.",
        auth: true,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "200", kind: "2xx", description: "Historical-price request succeeded; body omitted." },
          { status: "400", kind: "4xx", description: "Ticker or date range is invalid; body omitted." },
          { status: "401", kind: "4xx", description: "Bearer credential is missing or invalid; body omitted." },
          { status: "422", kind: "4xx", description: "Ticker is unsupported; body omitted." },
          { status: "500", kind: "5xx", description: "The request could not be completed; body omitted." },
          { status: "503", kind: "5xx", description: "Market data is unavailable; body omitted." },
        ],
      },
      {
        id: "optionsDailyHistoricalPrices",
        method: "OPTIONS",
        path: "/api/securities/{ticker}/prices",
        summary: "List supported historical-price methods",
        description: "Returns Allow: GET, HEAD, OPTIONS. No body and no authentication.",
        auth: false,
        auxiliary: true,
        params: [tickerParam],
        responses: [
          { status: "204", kind: "2xx", description: "Supported methods returned; no response body. Allow: GET, HEAD, OPTIONS." },
        ],
      },
    ],
  },
]

export const schemas: SchemaDef[] = [
  {
    id: "BrokerageAccount",
    name: "BrokerageAccount",
    description: "Durable state of an Investor\u2019s simulated brokerage account.",
    fields: [
      { name: "investorId", type: "string", required: true, description: "Exact, opaque Investor identifier." },
      { name: "availableCashCents", type: "integer \u2265 0", required: true, description: "Available Cash in cents." },
      { name: "realizedGainLossCents", type: "integer", required: true, description: "Cumulative signed Realized Gain or Loss in cents." },
      { name: "positions", type: "Position[]", required: true, description: "Positions ordered by Ticker ascending." },
    ],
  },
  {
    id: "Position",
    name: "Position",
    description: "A single held security within a Brokerage Account.",
    fields: [
      { name: "ticker", type: "CanonicalTicker", required: true, description: "^[A-Z][A-Z0-9.-]{0,9}$, 1\u201310 chars." },
      { name: "quantity", type: "integer \u2265 1", required: true, description: "Whole shares." },
      { name: "averageCostBasisCents", type: "integer \u2265 0", required: true, description: "Rounded weighted-average cost basis in cents per share." },
    ],
  },
  {
    id: "MarketOrderFill",
    name: "MarketOrderFill",
    description:
      "Immutable result of a filled Market Order. Discriminated by type into BuyFill and SellFill.",
    variants: ["BuyFill (type: buy_fill)", "SellFill (type: sell_fill)"],
    fields: [
      { name: "type", type: '"buy_fill" | "sell_fill"', required: true, description: "Discriminator." },
      { name: "ticker", type: "CanonicalTicker", required: true, description: "Filled security." },
      { name: "quantity", type: "integer \u2265 1", required: true, description: "Whole shares filled." },
      { name: "priceCents", type: "integer \u2265 1", required: true, description: "Fill price per share in cents." },
      { name: "totalCents", type: "integer \u2265 1", required: true, description: "Total consideration in cents." },
      { name: "costBasisCents", type: "integer \u2265 0", required: false, description: "Sell only: basis released by the sale." },
      { name: "realizedGainLossCents", type: "integer", required: false, description: "Sell only: signed realized gain or loss." },
      { name: "quoteTimestamp", type: "string (date-time)", required: true, description: "Provider quote timestamp (UTC ISO 8601)." },
    ],
  },
  {
    id: "AccountActivity",
    name: "AccountActivity",
    description:
      "One entry in an account\u2019s history. Discriminated by type.",
    variants: [
      "starting_cash",
      "cash_deposit",
      "cash_withdrawal",
      "buy_fill",
      "sell_fill",
    ],
    fields: [
      { name: "type", type: "activity type", required: true, description: "Discriminator for the activity kind." },
      { name: "amountCents", type: "integer", required: false, description: "Cash activities: amount moved, in cents." },
      { name: "ticker", type: "CanonicalTicker", required: false, description: "Fill activities: filled security." },
      { name: "createdAt", type: "string (date-time)", required: true, description: "When the activity was recorded (UTC ISO 8601)." },
    ],
    note: "List responses return at most 100 activities, newest first.",
  },
  {
    id: "TradableSecurity",
    name: "TradableSecurity",
    description: "Company facts for an active, US-listed security.",
    fields: [
      { name: "ticker", type: "CanonicalTicker", required: true, description: "Canonical uppercase ticker." },
      { name: "name", type: "string", required: true, description: "Trimmed provider name; at least one non-whitespace char." },
      { name: "exchange", type: "string", required: true, description: "One of AMEX, ARCA, BATS, CBOE, CBOE BZX, NASDAQ, NYSE, NYSE AMERICAN, NYSE ARCA. Provider casing preserved." },
    ],
  },
  {
    id: "SecurityQuote",
    name: "SecurityQuote",
    description: "A single point-in-time provider quote.",
    fields: [
      { name: "ticker", type: "CanonicalTicker", required: true, description: "Canonical uppercase ticker." },
      { name: "priceCents", type: "integer \u2265 1", required: true, description: "Quote price rounded to the nearest cent." },
      { name: "quoteTimestamp", type: "string (date-time)", required: true, description: "Provider source timestamp normalized to UTC ISO 8601." },
    ],
  },
  {
    id: "DailyPrice",
    name: "DailyPrice",
    description:
      "A single daily OHLCV row. High is at least every OHLC value; low is at most every OHLC value.",
    fields: [
      { name: "date", type: "string (date)", required: true, description: "Trading day (YYYY-MM-DD)." },
      { name: "openCents", type: "integer \u2265 1", required: true, description: "Opening price in cents." },
      { name: "highCents", type: "integer \u2265 1", required: true, description: "High price in cents." },
      { name: "lowCents", type: "integer \u2265 1", required: true, description: "Low price in cents." },
      { name: "closeCents", type: "integer \u2265 1", required: true, description: "Closing price in cents." },
      { name: "volume", type: "integer \u2265 0 | null", required: true, description: "Provider-supplied daily volume, or null when unavailable." },
    ],
  },
]

export const errorCodes: ErrorCode[] = [
  { code: "unauthorized", status: "401", message: "A valid bearer credential is required.", where: "Any authenticated endpoint" },
  { code: "invalid_request", status: "400", message: "Body, ticker, dates, or Idempotency-Key is malformed.", where: "Account, cash, order, and security endpoints" },
  { code: "not_found", status: "404", message: "Brokerage Account not found.", where: "Account, cash, order, activity endpoints" },
  { code: "account_already_exists", status: "409", message: "A Brokerage Account already exists for this Investor.", where: "Create account" },
  { code: "idempotency_conflict", status: "409", message: "Idempotency key was already used with a different request.", where: "All mutations" },
  { code: "cash_limit_exceeded", status: "422", message: "Cash Deposit would exceed the supported cash limit.", where: "Deposit" },
  { code: "insufficient_cash", status: "422", message: "Cash Withdrawal / Buy exceeds Available Cash.", where: "Withdraw, Buy order" },
  { code: "market_closed", status: "422", message: "Market Orders are accepted only during the Paper Trade session.", where: "Market order" },
  { code: "unsupported_ticker", status: "422", message: "Ticker is not a supported active US-listed stock or ETF.", where: "Order, security, quote, prices" },
  { code: "position_limit_exceeded", status: "422", message: "Buy Market Order would exceed the supported Position limit.", where: "Buy order" },
  { code: "insufficient_shares", status: "422", message: "Sell Market Order exceeds the Position quantity.", where: "Sell order" },
  { code: "account_limit_exceeded", status: "422", message: "Sell Market Order would exceed the supported account limit.", where: "Sell order" },
  { code: "internal_error", status: "500", message: "The request could not be completed.", where: "Any endpoint" },
  { code: "market_data_unavailable", status: "503", message: "Market data is temporarily unavailable.", where: "Order and security endpoints" },
  { code: "method_not_allowed", status: "405", message: "Method not allowed.", where: "Unsupported HTTP methods" },
]

export interface NavItem {
  id: string
  label: string
}
export interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: guides.map((g) => ({ id: g.id, label: g.title })),
  },
  ...groups.map((group) => ({
    id: group.id,
    title: group.tag,
    items: group.operations
      .filter((op) => !op.auxiliary)
      .map((op) => ({ id: op.id, label: op.summary })),
  })),
  {
    id: "reference",
    title: "Reference",
    items: [
      { id: "schemas", label: "Data models" },
      { id: "errors", label: "Error codes" },
    ],
  },
]
