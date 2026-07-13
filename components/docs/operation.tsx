import type { ApiOperation, ApiParam } from "@/lib/docs/spec"
import { MethodBadge } from "./method-badge"
import { CodeBlock } from "./code-block"

const statusStyles: Record<string, string> = {
  "2xx": "text-status-2xx border-status-2xx/30 bg-status-2xx/10",
  "4xx": "text-status-4xx border-status-4xx/30 bg-status-4xx/10",
  "5xx": "text-status-5xx border-status-5xx/30 bg-status-5xx/10",
}

const locationStyles: Record<ApiParam["location"], string> = {
  path: "text-method-get",
  query: "text-method-options",
  header: "text-method-post",
}

function examplePath(op: ApiOperation): string {
  let path = op.path
    .replace("{investorId}", "investor-123")
    .replace("{ticker}", "AAPL")
  const queryParams = op.params.filter((p) => p.location === "query")
  if (queryParams.length > 0) {
    path +=
      "?" + queryParams.map((p) => `${p.name}=${p.example ?? ""}`).join("&")
  }
  return path
}

function buildCurl(op: ApiOperation): string {
  const lines: string[] = [
    `curl -X ${op.method} "https://api.papertrade.example${examplePath(op)}"`,
  ]
  if (op.auth) lines.push(`  -H "Authorization: Bearer <credential>"`)
  const headerParams = op.params.filter((p) => p.location === "header")
  for (const h of headerParams) {
    lines.push(`  -H "${h.name}: ${h.example ?? ""}"`)
  }
  if (op.requestBody) {
    lines.push(`  -H "Content-Type: application/json"`)
    const body = op.requestBody.examples[0].code.replace(/\n\s*/g, " ").trim()
    lines.push(`  -d '${body}'`)
  }
  return lines.join(" \\\n")
}

function ParamRows({ params }: { params: ApiParam[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {params.map((param) => (
        <li key={`${param.location}-${param.name}`} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-[13px] font-medium text-foreground">
              {param.name}
            </code>
            <span className={`font-mono text-[11px] font-medium ${locationStyles[param.location]}`}>
              {param.location}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {param.type}
            </span>
            {param.required && (
              <span className="font-sans text-[11px] font-medium text-status-5xx">
                required
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {param.description}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function Operation({ op }: { op: ApiOperation }) {
  const successResponse = op.responses.find((r) => r.kind === "2xx" && r.example)
  const rightExample = successResponse?.example

  return (
    <section
      id={op.id}
      data-doc-section={op.id}
      className="scroll-mt-20 border-t border-border py-10 first:border-t-0"
    >
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* Left: description + params + responses */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <MethodBadge method={op.method} />
            <code className="break-all font-mono text-[13px] text-muted-foreground">
              {op.path}
            </code>
            {!op.auth && (
              <span className="rounded-sm border border-border px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground">
                No auth
              </span>
            )}
          </div>
          <h3 className="mt-3 text-pretty text-xl font-semibold tracking-tight text-foreground">
            {op.summary}
          </h3>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {op.description}
          </p>

          {op.params.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Parameters
              </h4>
              <ParamRows params={op.params} />
            </div>
          )}

          {op.requestBody && (
            <div className="mt-6">
              <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Request body
              </h4>
              <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
                {op.requestBody.description}
              </p>
            </div>
          )}

          <div className="mt-6">
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Responses
            </h4>
            <ul className="space-y-2">
              {op.responses.map((res) => (
                <li key={res.status}>
                  {res.example ? (
                    <details className="group rounded-lg border border-border open:bg-muted/40">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden">
                        <span className={`inline-flex min-w-11 justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${statusStyles[res.kind]}`}>
                          {res.status}
                        </span>
                        <span className="flex-1 text-[13px] leading-snug text-muted-foreground">
                          {res.description}
                        </span>
                        <svg
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4">
                        <CodeBlock code={res.example} title={`${res.status} response`} />
                      </div>
                    </details>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5">
                      <span className={`inline-flex min-w-11 justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${statusStyles[res.kind]}`}>
                        {res.status}
                      </span>
                      <span className="flex-1 text-[13px] leading-snug text-muted-foreground">
                        {res.description}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: sticky code samples */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-20 space-y-4">
            <CodeBlock code={buildCurl(op)} language="bash" title="Request" />
            {op.requestBody && (
              <CodeBlock
                code={op.requestBody.examples[0].code}
                title={
                  op.requestBody.examples.length > 1
                    ? `Body \u00b7 ${op.requestBody.examples[0].label}`
                    : "Request body"
                }
              />
            )}
            {rightExample && (
              <CodeBlock
                code={rightExample}
                title={`${successResponse?.status} response`}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
