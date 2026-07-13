import { lookUpTradableSecurity } from "../../../../lib/brokerageService"
import { fetchFinancialDatasetsFacts } from "../../../../lib/financialDatasets"
import {
  authenticationError,
  internalError,
  json,
} from "../../../../lib/routeResponses"

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
      await lookUpTradableSecurity(fetchFinancialDatasetsFacts, ticker),
    )
  } catch {
    return json(internalError)
  }
}
