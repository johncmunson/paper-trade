import { describe, expect, it } from "vitest"
import {
  DELETE as deleteAccount,
  OPTIONS as optionsAccount,
  PATCH as patchAccount,
  PUT as putAccount,
} from "../app/api/investors/[investorId]/account/route"
import {
  GET as getCashMovement,
  OPTIONS as optionsCashMovement,
} from "../app/api/investors/[investorId]/account/[cashMovement]/route"
import { POST as postActivities } from "../app/api/investors/[investorId]/account/activities/route"
import { GET as getMarketOrders } from "../app/api/investors/[investorId]/account/market-orders/route"
import { POST as postSecurityPrices } from "../app/api/securities/[ticker]/prices/route"
import { POST as postSecurityQuote } from "../app/api/securities/[ticker]/quote/route"
import {
  OPTIONS as optionsSecurity,
  POST as postSecurity,
} from "../app/api/securities/[ticker]/route"

type Handler = () => Response

const methodNotAllowed = {
  error: {
    code: "method_not_allowed",
    message: "Method not allowed.",
  },
}

describe("unsupported Route Handler methods", () => {
  it.each<[string, Handler, string]>([
    ["DELETE account", deleteAccount, "GET, HEAD, OPTIONS, POST"],
    ["PATCH account", patchAccount, "GET, HEAD, OPTIONS, POST"],
    ["PUT account", putAccount, "GET, HEAD, OPTIONS, POST"],
    ["GET cash movement", getCashMovement, "OPTIONS, POST"],
    ["GET market orders", getMarketOrders, "OPTIONS, POST"],
    ["POST activities", postActivities, "GET, HEAD, OPTIONS"],
    ["POST security", postSecurity, "GET, HEAD, OPTIONS"],
    ["POST security quote", postSecurityQuote, "GET, HEAD, OPTIONS"],
    ["POST security prices", postSecurityPrices, "GET, HEAD, OPTIONS"],
  ])("returns a structured 405 for %s", async (_, handler, allow) => {
    const response = handler()

    expect(response.status).toBe(405)
    expect(response.headers.get("allow")).toBe(allow)
    await expect(response.json()).resolves.toEqual(methodNotAllowed)
  })

  it.each<[string, Handler, string]>([
    ["account", optionsAccount, "GET, HEAD, OPTIONS, POST"],
    ["cash movement", optionsCashMovement, "OPTIONS, POST"],
    ["security", optionsSecurity, "GET, HEAD, OPTIONS"],
  ])("keeps OPTIONS accurate for %s routes", (_, handler, allow) => {
    const response = handler()

    expect(response.status).toBe(204)
    expect(response.headers.get("allow")).toBe(allow)
    expect(response.body).toBeNull()
  })
})
