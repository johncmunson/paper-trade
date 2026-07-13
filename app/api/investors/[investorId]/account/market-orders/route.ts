import {
  isValidMarketOrder,
  submitMarketOrder,
  type ApplicationResult,
  type MarketOrderCommand,
} from "../../../../../../lib/brokerageService"
import {
  fetchFinancialDatasetsFacts,
  fetchFinancialDatasetsQuote,
} from "../../../../../../lib/financialDatasets"
import { marketAlwaysOpen } from "../../../../../../lib/marketConfig"
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
        'side must be "buy", Ticker must be valid, quantity must be a positive safe whole number, and Idempotency-Key is required.',
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json(invalidRequest)
    }
    const values =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {}
    const { investorId } = await context.params
    const command: MarketOrderCommand = {
      investorId,
      side: values.side,
      ticker: values.ticker,
      quantity: values.quantity,
      idempotencyKey: request.headers.get("idempotency-key") ?? "",
    }
    if (!isValidMarketOrder(command)) return json(invalidRequest)

    const { postgresBrokerageStore } =
      await import("../../../../../../db/brokerageStore")
    return json(
      await submitMarketOrder(
        postgresBrokerageStore,
        fetchFinancialDatasetsFacts,
        fetchFinancialDatasetsQuote,
        command,
        { marketAlwaysOpen: marketAlwaysOpen() },
      ),
    )
  } catch {
    return json(internalError)
  }
}
