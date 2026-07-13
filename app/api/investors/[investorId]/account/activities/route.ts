import { listAccountActivities } from "../../../../../../lib/brokerageService"
import {
  authenticationError,
  internalError,
  json,
} from "../../../../../../lib/routeResponses"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ investorId: string }> },
) {
  try {
    const error = authenticationError(request)
    if (error) return error

    const { investorId } = await context.params
    const { postgresBrokerageStore } =
      await import("../../../../../../db/brokerageStore")
    return json(await listAccountActivities(postgresBrokerageStore, investorId))
  } catch {
    return json(internalError)
  }
}
