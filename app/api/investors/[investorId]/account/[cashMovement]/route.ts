import {
  depositCash,
  isValidCashMovement,
  withdrawCash,
  type ApplicationResult,
} from "../../../../../../lib/brokerageService"
import {
  authenticationError,
  internalError,
  json,
} from "../../../../../../lib/routeResponses"

export const runtime = "nodejs"

const invalidRequest: ApplicationResult = {
  status: 400,
  body: {
    error: {
      code: "invalid_request",
      message:
        "amountCents must be a positive safe integer and Idempotency-Key is required.",
    },
  },
}

const notFound: ApplicationResult = {
  status: 404,
  body: { error: { code: "not_found", message: "Endpoint not found." } },
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ investorId: string; cashMovement: string }>
  },
) {
  try {
    const error = authenticationError(request)
    if (error) return error

    const { investorId, cashMovement } = await context.params
    const operation =
      cashMovement === "deposits"
        ? depositCash
        : cashMovement === "withdrawals"
          ? withdrawCash
          : undefined
    if (!operation) return json(notFound)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json(invalidRequest)
    }

    const amountCents =
      typeof body === "object" && body !== null
        ? (body as { amountCents?: unknown }).amountCents
        : undefined
    const idempotencyKey = request.headers.get("idempotency-key") ?? ""
    if (!isValidCashMovement(amountCents, idempotencyKey)) {
      return json(invalidRequest)
    }

    const { postgresBrokerageStore } =
      await import("../../../../../../db/brokerageStore")
    return json(
      await operation(postgresBrokerageStore, {
        investorId,
        amountCents,
        idempotencyKey,
      }),
    )
  } catch {
    return json(internalError)
  }
}
