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

export type ErrorBody = {
  error: { code: string; message: string }
}

export type ApplicationResult = {
  status: number
  body: BrokerageAccount | ErrorBody
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
  insertIdempotency(record: IdempotencyRecord): Promise<void>
}

export type BrokerageStore = {
  transaction<T>(
    work: (transaction: BrokerageTransaction) => Promise<T>,
  ): Promise<T>
  findAccount(investorId: string): Promise<BrokerageAccount | undefined>
}

export type CreateBrokerageAccountCommand = {
  investorId: string
  startingCashCents: number
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

export async function readBrokerageAccount(
  store: BrokerageStore,
  investorId: string,
): Promise<ApplicationResult> {
  const account = await store.findAccount(investorId)

  return account
    ? { status: 200, body: account }
    : {
        status: 404,
        body: {
          error: {
            code: "not_found",
            message: "Brokerage Account not found.",
          },
        },
      }
}
