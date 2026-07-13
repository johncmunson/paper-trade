import { getDailyHistoricalPrices } from "../../../../../lib/brokerageService"
import { fetchFinancialDatasetsHistoricalPrices } from "../../../../../lib/financialDatasets"
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
    const parameters = new URL(request.url).searchParams
    return json(
      await getDailyHistoricalPrices(
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
