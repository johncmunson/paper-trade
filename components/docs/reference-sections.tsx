import type { ErrorCode, SchemaDef } from "@/lib/docs/spec"

const statusStyles: Record<string, string> = {
  "2": "text-status-2xx border-status-2xx/30 bg-status-2xx/10",
  "4": "text-status-4xx border-status-4xx/30 bg-status-4xx/10",
  "5": "text-status-5xx border-status-5xx/30 bg-status-5xx/10",
}

function statusStyle(status: string) {
  return statusStyles[status[0]] ?? statusStyles["4"]
}

export function SchemasSection({ schemas }: { schemas: SchemaDef[] }) {
  return (
    <section
      id="schemas"
      data-doc-section="schemas"
      className="scroll-mt-20 border-t border-border py-10"
    >
      <h2 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
        Data models
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        The response shapes returned across the API. Monetary values ending in{" "}
        <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground">
          Cents
        </code>{" "}
        are integer cents; safe integers stay within JavaScript&apos;s safe range.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {schemas.map((schema) => (
          <div
            key={schema.id}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-mono text-[14px] font-semibold text-foreground">
                {schema.name}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {schema.description}
              </p>
              {schema.variants && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {schema.variants.map((v) => (
                    <span
                      key={v}
                      className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {schema.fields && (
              <ul className="divide-y divide-border">
                {schema.fields.map((field) => (
                  <li key={field.name} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <code className="font-mono text-[13px] font-medium text-foreground">
                        {field.name}
                      </code>
                      <span className="font-mono text-[11px] text-accent">
                        {field.type}
                      </span>
                      {!field.required && (
                        <span className="font-sans text-[11px] text-muted-foreground">
                          optional
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {field.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {schema.note && (
              <p className="border-t border-border bg-muted/40 px-4 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                {schema.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export function ErrorsSection({ errors }: { errors: ErrorCode[] }) {
  return (
    <section
      id="errors"
      data-doc-section="errors"
      className="scroll-mt-20 border-t border-border py-10"
    >
      <h2 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
        Error codes
      </h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        Errors are returned as{" "}
        <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground">
          {"{ error: { code, message } }"}
        </code>{" "}
        with a stable machine-readable{" "}
        <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground">
          code
        </code>
        .
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Code
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                Message
              </th>
              <th className="hidden px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                Where
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {errors.map((err) => (
              <tr key={err.code} className="align-top transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <code className="font-mono text-[12.5px] font-medium text-foreground">
                    {err.code}
                  </code>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground sm:hidden">
                    {err.message}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex justify-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${statusStyle(err.status)}`}>
                    {err.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-[13px] leading-relaxed text-muted-foreground sm:table-cell">
                  {err.message}
                </td>
                <td className="hidden px-4 py-3 text-[13px] leading-relaxed text-muted-foreground md:table-cell">
                  {err.where}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
