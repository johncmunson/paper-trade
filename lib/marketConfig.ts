export function marketAlwaysOpen(
  env: {
    NODE_ENV?: string
    PAPER_TRADE_MARKET_ALWAYS_OPEN?: string
  } = process.env,
) {
  return env.PAPER_TRADE_MARKET_ALWAYS_OPEN === "true"
}
