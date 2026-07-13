import {
  createBrokerageAccount,
  readBrokerageAccount,
  type ApplicationResult,
} from "../../../../../lib/brokerageService"
import {
  authenticationError,
  internalError,
  json,
  methodNotAllowed,
  options,
} from "../../../../../lib/routeResponses"

export const runtime = "nodejs"

const allow = "GET, HEAD, OPTIONS, POST"
const unsupported = methodNotAllowed(allow)
export const OPTIONS = options(allow)
export { unsupported as DELETE, unsupported as PATCH, unsupported as PUT }

const invalidRequest: ApplicationResult = {
  status: 400,
  body: {
    error: {
      code: "invalid_request",
      message:
        "startingCashCents must be a non-negative safe integer and Idempotency-Key is required.",
    },
  },
}

export async function POST(
  request: Request,
  context: { params: Promise<{ investorId: string }> },
) {
  try {
    const error = authenticationError(request)
    if (error) return error

    const idempotencyKey = request.headers.get("idempotency-key")
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json(invalidRequest)
    }
    const startingCashCents =
      typeof body === "object" && body !== null
        ? (body as { startingCashCents?: unknown }).startingCashCents
        : undefined

    if (
      !idempotencyKey?.trim() ||
      !Number.isSafeInteger(startingCashCents) ||
      (startingCashCents as number) < 0
    ) {
      return json(invalidRequest)
    }

    const { investorId } = await context.params
    const { postgresBrokerageStore } =
      await import("../../../../../db/brokerageStore")
    return json(
      await createBrokerageAccount(postgresBrokerageStore, {
        investorId,
        startingCashCents: startingCashCents as number,
        idempotencyKey,
      }),
    )
  } catch {
    return json(internalError)
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ investorId: string }> },
) {
  try {
    const error = authenticationError(request)
    if (error) return error

    const { investorId } = await context.params
    const { postgresBrokerageStore } =
      await import("../../../../../db/brokerageStore")
    return json(await readBrokerageAccount(postgresBrokerageStore, investorId))
  } catch {
    return json(internalError)
  }
}
