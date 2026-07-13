import type {
  FinancialDatasetsFacts,
  FinancialDatasetsHistoricalPrices,
  FinancialDatasetsQuote,
  FinancialDatasetsResult,
} from "./financialDatasets"

export type Position = {
  ticker: string
  quantity: number
  averageCostBasisCents: number
}

export type BrokerageAccount = {
  investorId: string
  availableCashCents: number
  realizedGainLossCents: number
  positions: Position[]
}

type AccountActivityBase = {
  createdAt: string
}

export type AccountActivity =
  | (AccountActivityBase & {
      type: "starting_cash" | "cash_deposit" | "cash_withdrawal"
      amountCents: number
    })
  | (AccountActivityBase & {
      type: "buy_fill"
      ticker: string
      quantity: number
      priceCents: number
      totalCents: number
      quoteTimestamp: string
    })
  | (AccountActivityBase & {
      type: "sell_fill"
      ticker: string
      quantity: number
      priceCents: number
      totalCents: number
      costBasisCents: number
      realizedGainLossCents: number
      quoteTimestamp: string
    })

export type AccountActivityList = {
  activities: AccountActivity[]
}

export type TradableSecurity = {
  ticker: string
  name: string
  exchange: string
}

export type SecurityQuote = {
  ticker: string
  priceCents: number
  quoteTimestamp: string
}

export type DailyHistoricalPrices = {
  ticker: string
  prices: Array<{
    date: string
    openCents: number
    highCents: number
    lowCents: number
    closeCents: number
    volume: number | null
  }>
}

export type ErrorBody = {
  error: { code: string; message: string }
}

export type ApplicationResult = {
  status: number
  body:
    | BrokerageAccount
    | AccountActivityList
    | TradableSecurity
    | SecurityQuote
    | DailyHistoricalPrices
    | ErrorBody
}

export type IdempotencyRecord = ApplicationResult & {
  investorId: string
  key: string
  fingerprint: string
}

type BrokerageTransaction = {
  lockIdempotency(investorId: string, key: string): Promise<void>
  findIdempotency(
    investorId: string,
    key: string,
  ): Promise<IdempotencyRecord | undefined>
  insertAccount(account: BrokerageAccount): Promise<boolean>
  insertStartingCashActivity(
    investorId: string,
    amountCents: number,
  ): Promise<void>
  lockAccount(investorId: string): Promise<BrokerageAccount | undefined>
  updateAvailableCash(
    investorId: string,
    availableCashCents: number,
  ): Promise<void>
  insertCashActivity(
    investorId: string,
    type: "cash_deposit" | "cash_withdrawal",
    amountCents: number,
  ): Promise<void>
  insertIdempotency(record: IdempotencyRecord): Promise<void>
}

export type BrokerageStore = {
  transaction<T>(
    work: (transaction: BrokerageTransaction) => Promise<T>,
  ): Promise<T>
  findAccount(investorId: string): Promise<BrokerageAccount | undefined>
  findActivities(investorId: string, limit: number): Promise<AccountActivity[]>
}

export type CreateBrokerageAccountCommand = {
  investorId: string
  startingCashCents: number
  idempotencyKey: string
}

export type CashMovementCommand = {
  investorId: string
  amountCents: number
  idempotencyKey: string
}

const idempotencyConflict: ApplicationResult = {
  status: 409,
  body: {
    error: {
      code: "idempotency_conflict",
      message: "Idempotency key was already used with a different request.",
    },
  },
}

const accountAlreadyExists: ApplicationResult = {
  status: 409,
  body: {
    error: {
      code: "account_already_exists",
      message: "A Brokerage Account already exists for this Investor.",
    },
  },
}

const accountNotFound: ApplicationResult = {
  status: 404,
  body: {
    error: {
      code: "not_found",
      message: "Brokerage Account not found.",
    },
  },
}

const invalidCashMovement: ApplicationResult = {
  status: 400,
  body: {
    error: {
      code: "invalid_request",
      message:
        "amountCents must be a positive safe integer and Idempotency-Key is required.",
    },
  },
}

const cashLimitExceeded: ApplicationResult = {
  status: 422,
  body: {
    error: {
      code: "cash_limit_exceeded",
      message: "Cash Deposit would exceed the supported cash limit.",
    },
  },
}

const insufficientCash: ApplicationResult = {
  status: 422,
  body: {
    error: {
      code: "insufficient_cash",
      message: "Cash Withdrawal exceeds Available Cash.",
    },
  },
}

const invalidTicker: ApplicationResult = {
  status: 400,
  body: {
    error: { code: "invalid_request", message: "Ticker is malformed." },
  },
}

const unsupportedTicker: ApplicationResult = {
  status: 422,
  body: {
    error: {
      code: "unsupported_ticker",
      message: "Ticker is not a supported active US-listed stock or ETF.",
    },
  },
}

const marketDataUnavailable: ApplicationResult = {
  status: 503,
  body: {
    error: {
      code: "market_data_unavailable",
      message: "Market data is temporarily unavailable.",
    },
  },
}

const invalidDateRange: ApplicationResult = {
  status: 400,
  body: {
    error: {
      code: "invalid_request",
      message:
        "startDate and endDate must be valid YYYY-MM-DD dates in chronological order.",
    },
  },
}

const usExchanges = new Set([
  "AMEX",
  "ARCA",
  "BATS",
  "CBOE",
  "CBOE BZX",
  "NASDAQ",
  "NYSE",
  "NYSE AMERICAN",
  "NYSE ARCA",
])

function normalizeTicker(input: string) {
  const ticker = input.trim().toUpperCase()
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker) ? ticker : undefined
}

function isDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  )
}

function priceToCents(price: number) {
  const [coefficient, exponent = "0"] = price.toString().split("e")
  return Math.round(Number(`${coefficient}e${Number(exponent) + 2}`))
}

export async function lookUpTradableSecurity(
  fetchFacts: (ticker: string) => Promise<FinancialDatasetsResult>,
  tickerInput: string,
): Promise<ApplicationResult> {
  const ticker = normalizeTicker(tickerInput)
  if (!ticker) return invalidTicker

  const result = await fetchFacts(ticker)
  if (result.status === "not_found") return unsupportedTicker
  if (result.status === "unavailable") return marketDataUnavailable
  if (typeof result.data !== "object" || result.data === null) {
    return marketDataUnavailable
  }

  const facts = result.data as Partial<FinancialDatasetsFacts>
  if (
    facts.ticker !== ticker ||
    typeof facts.name !== "string" ||
    !facts.name.trim() ||
    typeof facts.exchange !== "string" ||
    !facts.exchange.trim() ||
    typeof facts.isActive !== "boolean"
  ) {
    return marketDataUnavailable
  }
  if (
    !facts.isActive ||
    !usExchanges.has(facts.exchange.trim().toUpperCase())
  ) {
    return unsupportedTicker
  }

  return {
    status: 200,
    body: {
      ticker: facts.ticker,
      name: facts.name.trim(),
      exchange: facts.exchange.trim(),
    },
  }
}

export async function quoteTradableSecurity(
  fetchQuote: (ticker: string) => Promise<FinancialDatasetsResult>,
  tickerInput: string,
): Promise<ApplicationResult> {
  const ticker = normalizeTicker(tickerInput)
  if (!ticker) return invalidTicker

  const result = await fetchQuote(ticker)
  if (result.status === "not_found") return unsupportedTicker
  if (result.status === "unavailable") return marketDataUnavailable
  if (typeof result.data !== "object" || result.data === null) {
    return marketDataUnavailable
  }

  const quote = result.data as Partial<FinancialDatasetsQuote>
  if (
    quote.ticker !== ticker ||
    typeof quote.price !== "number" ||
    !Number.isFinite(quote.price) ||
    quote.price <= 0 ||
    typeof quote.quoteTimestamp !== "string"
  ) {
    return marketDataUnavailable
  }

  const priceCents = priceToCents(quote.price)
  const quoteTimestamp = new Date(quote.quoteTimestamp)
  if (
    !Number.isSafeInteger(priceCents) ||
    priceCents <= 0 ||
    Number.isNaN(quoteTimestamp.valueOf())
  ) {
    return marketDataUnavailable
  }

  return {
    status: 200,
    body: { ticker, priceCents, quoteTimestamp: quoteTimestamp.toISOString() },
  }
}

export async function getDailyHistoricalPrices(
  fetchPrices: (
    ticker: string,
    startDate: string,
    endDate: string,
  ) => Promise<FinancialDatasetsResult>,
  tickerInput: string,
  startDate: string,
  endDate: string,
): Promise<ApplicationResult> {
  const ticker = normalizeTicker(tickerInput)
  if (!ticker) return invalidTicker
  if (!isDate(startDate) || !isDate(endDate) || startDate > endDate) {
    return invalidDateRange
  }

  const result = await fetchPrices(ticker, startDate, endDate)
  if (result.status === "not_found") return unsupportedTicker
  if (result.status === "unavailable") return marketDataUnavailable
  if (typeof result.data !== "object" || result.data === null) {
    return marketDataUnavailable
  }

  const history = result.data as Partial<FinancialDatasetsHistoricalPrices>
  if (history.ticker !== ticker || !Array.isArray(history.prices)) {
    return marketDataUnavailable
  }

  const prices: DailyHistoricalPrices["prices"] = []
  for (const value of history.prices as unknown[]) {
    if (typeof value !== "object" || value === null) {
      return marketDataUnavailable
    }
    const price = value as Partial<
      FinancialDatasetsHistoricalPrices["prices"][number]
    >
    if (
      typeof price.date !== "string" ||
      !isDate(price.date) ||
      price.date < startDate ||
      price.date > endDate ||
      typeof price.open !== "number" ||
      typeof price.high !== "number" ||
      typeof price.low !== "number" ||
      typeof price.close !== "number" ||
      ![price.open, price.high, price.low, price.close].every(
        (amount) => Number.isFinite(amount) && amount > 0,
      ) ||
      price.high < Math.max(price.open, price.close, price.low) ||
      price.low > Math.min(price.open, price.close, price.high) ||
      (price.volume !== null &&
        (!Number.isSafeInteger(price.volume) || (price.volume ?? -1) < 0))
    ) {
      return marketDataUnavailable
    }

    const cents = [price.open, price.high, price.low, price.close].map(
      priceToCents,
    )
    if (!cents.every((amount) => Number.isSafeInteger(amount) && amount > 0)) {
      return marketDataUnavailable
    }
    prices.push({
      date: price.date,
      openCents: cents[0],
      highCents: cents[1],
      lowCents: cents[2],
      closeCents: cents[3],
      volume: price.volume ?? null,
    })
  }

  return { status: 200, body: { ticker, prices } }
}

export async function createBrokerageAccount(
  store: BrokerageStore,
  command: CreateBrokerageAccountCommand,
): Promise<ApplicationResult> {
  const fingerprint = JSON.stringify({
    startingCashCents: command.startingCashCents,
  })

  return store.transaction(async (transaction) => {
    await transaction.lockIdempotency(
      command.investorId,
      command.idempotencyKey,
    )

    const previous = await transaction.findIdempotency(
      command.investorId,
      command.idempotencyKey,
    )

    if (previous) {
      return previous.fingerprint === fingerprint
        ? { status: previous.status, body: previous.body }
        : idempotencyConflict
    }

    const account: BrokerageAccount = {
      investorId: command.investorId,
      availableCashCents: command.startingCashCents,
      realizedGainLossCents: 0,
      positions: [],
    }
    const result = (await transaction.insertAccount(account))
      ? { status: 201, body: account }
      : accountAlreadyExists

    if (result.status === 201) {
      await transaction.insertStartingCashActivity(
        command.investorId,
        command.startingCashCents,
      )
    }

    await transaction.insertIdempotency({
      investorId: command.investorId,
      key: command.idempotencyKey,
      fingerprint,
      ...result,
    })

    return result
  })
}

type CashMovementType = "cash_deposit" | "cash_withdrawal"

export function isValidCashMovement(
  amountCents: unknown,
  idempotencyKey: string,
): amountCents is number {
  return (
    Boolean(idempotencyKey.trim()) &&
    Number.isSafeInteger(amountCents) &&
    (amountCents as number) > 0
  )
}

async function moveCash(
  store: BrokerageStore,
  command: CashMovementCommand,
  type: CashMovementType,
): Promise<ApplicationResult> {
  if (!isValidCashMovement(command.amountCents, command.idempotencyKey)) {
    return invalidCashMovement
  }

  const fingerprint = JSON.stringify({
    operation: type,
    amountCents: command.amountCents,
  })

  return store.transaction(async (transaction) => {
    await transaction.lockIdempotency(
      command.investorId,
      command.idempotencyKey,
    )
    const previous = await transaction.findIdempotency(
      command.investorId,
      command.idempotencyKey,
    )
    if (previous) {
      return previous.fingerprint === fingerprint
        ? { status: previous.status, body: previous.body }
        : idempotencyConflict
    }

    const recordResult = async (result: ApplicationResult) => {
      await transaction.insertIdempotency({
        investorId: command.investorId,
        key: command.idempotencyKey,
        fingerprint,
        ...result,
      })
      return result
    }

    const account = await transaction.lockAccount(command.investorId)
    if (!account) return recordResult(accountNotFound)

    const availableCashCents =
      type === "cash_deposit"
        ? account.availableCashCents + command.amountCents
        : account.availableCashCents - command.amountCents
    if (type === "cash_deposit" && !Number.isSafeInteger(availableCashCents)) {
      return recordResult(cashLimitExceeded)
    }
    if (availableCashCents < 0) return recordResult(insufficientCash)

    account.availableCashCents = availableCashCents
    await transaction.updateAvailableCash(
      command.investorId,
      availableCashCents,
    )
    await transaction.insertCashActivity(
      command.investorId,
      type,
      command.amountCents,
    )

    return recordResult({ status: 200, body: account })
  })
}

export function depositCash(
  store: BrokerageStore,
  command: CashMovementCommand,
): Promise<ApplicationResult> {
  return moveCash(store, command, "cash_deposit")
}

export function withdrawCash(
  store: BrokerageStore,
  command: CashMovementCommand,
): Promise<ApplicationResult> {
  return moveCash(store, command, "cash_withdrawal")
}

export async function listAccountActivities(
  store: BrokerageStore,
  investorId: string,
): Promise<ApplicationResult> {
  if (!(await store.findAccount(investorId))) return accountNotFound

  return {
    status: 200,
    body: { activities: await store.findActivities(investorId, 100) },
  }
}

export async function readBrokerageAccount(
  store: BrokerageStore,
  investorId: string,
): Promise<ApplicationResult> {
  const account = await store.findAccount(investorId)

  return account ? { status: 200, body: account } : accountNotFound
}
