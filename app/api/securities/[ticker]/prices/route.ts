import { getDailyHistoricalPrices } from "../../../../../lib/brokerageService"
import {
  fetchFinancialDatasetsFacts,
  fetchFinancialDatasetsHistoricalPrices,
} from "../../../../../lib/financialDatasets"
import {
  authenticationError,
  internalError,
  json,
  methodNotAllowed,
  options,
} from "../../../../../lib/routeResponses"

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
    const parameters = new URL(request.url).searchParams
    return json(
      await getDailyHistoricalPrices(
        fetchFinancialDatasetsFacts,
        fetchFinancialDatasetsHistoricalPrices,
        ticker,
        parameters.get("startDate") ?? "",
        parameters.get("endDate") ?? "",
      ),
    )
  } catch {
    return json(internalError)
  }
}
