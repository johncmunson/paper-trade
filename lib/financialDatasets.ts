export type FinancialDatasetsFacts = {
  ticker: string
  name: string
  exchange: string
  isActive: boolean
}

export type FinancialDatasetsQuote = {
  ticker: string
  price: number
  quoteTimestamp: string
}

export type FinancialDatasetsHistoricalPrices = {
  ticker: string
  prices: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number | null
  }>
}

export type FinancialDatasetsResult<T = unknown> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "unavailable" }

const baseUrl = "https://api.financialdatasets.ai"

async function fetchFinancialDatasets(
  path: string,
  parameters: Record<string, string>,
): Promise<FinancialDatasetsResult> {
  const apiKey = process.env.FINANCIAL_DATASETS_API_KEY
  if (!apiKey) return { status: "unavailable" }

  try {
    const response = await fetch(
      `${baseUrl}${path}?${new URLSearchParams(parameters)}`,
      {
        headers: { "X-API-KEY": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (response.status === 404) return { status: "not_found" }
    if (!response.ok) return { status: "unavailable" }

    return { status: "ok", data: await response.json() }
  } catch {
    return { status: "unavailable" }
  }
}

export async function fetchFinancialDatasetsFacts(
  ticker: string,
): Promise<FinancialDatasetsResult<FinancialDatasetsFacts>> {
  const result = await fetchFinancialDatasets("/company/facts", { ticker })
  if (result.status !== "ok") return result

  const facts = (
    result.data as {
      company_facts?: {
        ticker?: unknown
        name?: unknown
        exchange?: unknown
        is_active?: unknown
      }
    }
  )?.company_facts
  if (
    typeof facts?.ticker !== "string" ||
    typeof facts.name !== "string" ||
    typeof facts.exchange !== "string" ||
    typeof facts.is_active !== "boolean"
  ) {
    return { status: "unavailable" }
  }

  return {
    status: "ok",
    data: {
      ticker: facts.ticker,
      name: facts.name,
      exchange: facts.exchange,
      isActive: facts.is_active,
    },
  }
}

export async function fetchFinancialDatasetsQuote(
  ticker: string,
): Promise<FinancialDatasetsResult<FinancialDatasetsQuote>> {
  const result = await fetchFinancialDatasets("/prices/snapshot", { ticker })
  if (result.status !== "ok") return result

  const snapshot = (
    result.data as {
      snapshot?: {
        ticker?: unknown
        price?: unknown
        time_milliseconds?: unknown
      }
    }
  )?.snapshot
  if (
    typeof snapshot?.ticker !== "string" ||
    typeof snapshot.price !== "number" ||
    !Number.isSafeInteger(snapshot.time_milliseconds) ||
    (snapshot.time_milliseconds as number) <= 0
  ) {
    return { status: "unavailable" }
  }

  const timestamp = new Date(snapshot.time_milliseconds as number)
  if (Number.isNaN(timestamp.valueOf())) return { status: "unavailable" }

  return {
    status: "ok",
    data: {
      ticker: snapshot.ticker,
      price: snapshot.price,
      quoteTimestamp: timestamp.toISOString(),
    },
  }
}

export async function fetchFinancialDatasetsHistoricalPrices(
  ticker: string,
  startDate: string,
  endDate: string,
): Promise<FinancialDatasetsResult<FinancialDatasetsHistoricalPrices>> {
  const result = await fetchFinancialDatasets("/prices", {
    ticker,
    interval: "day",
    start_date: startDate,
    end_date: endDate,
  })
  if (result.status !== "ok") return result
  if (typeof result.data !== "object" || result.data === null) {
    return { status: "unavailable" }
  }

  const response = result.data as {
    ticker?: unknown
    prices?: Array<{
      ticker?: unknown
      open?: unknown
      high?: unknown
      low?: unknown
      close?: unknown
      volume?: unknown
      time?: unknown
    }>
  }
  if (
    (response.ticker !== undefined && response.ticker !== ticker) ||
    !Array.isArray(response.prices)
  ) {
    return { status: "unavailable" }
  }

  const prices: FinancialDatasetsHistoricalPrices["prices"] = []
  for (const value of response.prices as unknown[]) {
    if (typeof value !== "object" || value === null) {
      return { status: "unavailable" }
    }
    const price = value as {
      ticker?: unknown
      open?: unknown
      high?: unknown
      low?: unknown
      close?: unknown
      volume?: unknown
      time?: unknown
    }
    if (
      (price.ticker !== undefined && price.ticker !== ticker) ||
      typeof price.time !== "string" ||
      typeof price.open !== "number" ||
      typeof price.high !== "number" ||
      typeof price.low !== "number" ||
      typeof price.close !== "number" ||
      (price.volume !== undefined &&
        price.volume !== null &&
        !Number.isSafeInteger(price.volume))
    ) {
      return { status: "unavailable" }
    }
    prices.push({
      date: price.time,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: (price.volume as number | null | undefined) ?? null,
    })
  }

  return { status: "ok", data: { ticker, prices } }
}
