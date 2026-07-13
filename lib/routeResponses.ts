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

export function methodNotAllowed(allow: string) {
  return () =>
    Response.json(
      {
        error: {
          code: "method_not_allowed",
          message: "Method not allowed.",
        },
      },
      { status: 405, headers: { Allow: allow } },
    )
}

export function options(allow: string) {
  return () => new Response(null, { status: 204, headers: { Allow: allow } })
}
