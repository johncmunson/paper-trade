export function marketAlwaysOpen(
  env: {
    NODE_ENV?: string
    PAPER_TRADE_MARKET_ALWAYS_OPEN?: string
  } = process.env,
) {
  const enabled = env.PAPER_TRADE_MARKET_ALWAYS_OPEN === "true"
  if (enabled && env.NODE_ENV === "production") {
    throw new Error(
      "PAPER_TRADE_MARKET_ALWAYS_OPEN=true is forbidden in production.",
    )
  }
  return enabled && env.NODE_ENV === "development"
}
