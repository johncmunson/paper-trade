import { quoteTradableSecurity } from "../../../../../lib/brokerageService"
import { fetchFinancialDatasetsQuote } from "../../../../../lib/financialDatasets"
import {
  authenticationError,
  internalError,
  json,
} from "../../../../../lib/routeResponses"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  try {
    const error = authenticationError(request)
    if (error) return error

    const { ticker } = await context.params
    return json(
      await quoteTradableSecurity(fetchFinancialDatasetsQuote, ticker),
    )
  } catch {
    return json(internalError)
  }
}
