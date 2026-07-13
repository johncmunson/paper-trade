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

export type ErrorBody = {
  error: { code: string; message: string }
}

export type ApplicationResult = {
  status: number
  body: BrokerageAccount | AccountActivityList | ErrorBody
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
