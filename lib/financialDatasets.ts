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

export type FinancialDatasetsResult<T = unknown> =
  | { status: "ok"; data: T }
  | { status: "not_found" }
  | { status: "unavailable" }

const baseUrl = "https://api.financialdatasets.ai"

async function fetchFinancialDatasets(
  path: string,
  ticker: string,
): Promise<FinancialDatasetsResult> {
  const apiKey = process.env.FINANCIAL_DATASETS_API_KEY
  if (!apiKey) return { status: "unavailable" }

  try {
    const response = await fetch(
      `${baseUrl}${path}?${new URLSearchParams({ ticker })}`,
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
  const result = await fetchFinancialDatasets("/company/facts", ticker)
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
  const result = await fetchFinancialDatasets("/prices/snapshot", ticker)
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
