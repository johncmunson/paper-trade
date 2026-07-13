import { lookUpTradableSecurity } from "../../../../lib/brokerageService"
import { fetchFinancialDatasetsFacts } from "../../../../lib/financialDatasets"
import {
  authenticationError,
  internalError,
  json,
  methodNotAllowed,
  options,
} from "../../../../lib/routeResponses"

export const runtime = "nodejs"

const allow = "GET, HEAD, OPTIONS"
const unsupported = methodNotAllowed(allow)
export const OPTIONS = options(allow)
export {
  unsupported as DELETE,
  unsupported as PATCH,
  unsupported as POST,
  unsupported as PUT,
}

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
