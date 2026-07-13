import { createHash, timingSafeEqual } from "node:crypto"

export function hasValidServiceCredential(request: Request) {
  const expected = process.env.PAPER_TRADE_SERVICE_CREDENTIAL
  if (!expected) {
    throw new Error("PAPER_TRADE_SERVICE_CREDENTIAL must be set.")
  }

  const match = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)
  if (!match) return false

  const digest = (value: string) => createHash("sha256").update(value).digest()
  return timingSafeEqual(digest(match[1]), digest(expected))
}
