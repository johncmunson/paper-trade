import type { ApplicationResult } from "./brokerageService"
import { hasValidServiceCredential } from "./serviceAuthentication"

export const internalError: ApplicationResult = {
  status: 500,
  body: {
    error: {
      code: "internal_error",
      message: "The request could not be completed.",
    },
  },
}

const unauthorized: ApplicationResult = {
  status: 401,
  body: {
    error: {
      code: "unauthorized",
      message: "A valid bearer credential is required.",
    },
  },
}

export function json(result: ApplicationResult) {
  return Response.json(result.body, { status: result.status })
}

export function authenticationError(request: Request) {
  return hasValidServiceCredential(request) ? undefined : json(unauthorized)
}
