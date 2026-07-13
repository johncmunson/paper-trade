import { listAccountActivities } from "../../../../../../lib/brokerageService"
import {
  authenticationError,
  internalError,
  json,
  methodNotAllowed,
  options,
} from "../../../../../../lib/routeResponses"

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
