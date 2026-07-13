import type { GuideSection } from "@/lib/docs/spec"
import { CodeBlock } from "./code-block"

function Callout({ tone, text }: { tone: "info" | "warn"; text: string }) {
  const styles =
    tone === "warn"
      ? "border-status-4xx/30 bg-status-4xx/8"
      : "border-accent/30 bg-accent/8"
  const iconColor = tone === "warn" ? "text-status-4xx" : "text-accent"
  return (
    <div className={`mt-5 flex gap-3 rounded-lg border px-4 py-3 ${styles}`}>
      <svg
        className={`mt-0.5 size-4 shrink-0 ${iconColor}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {tone === "warn" ? (
          <>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </>
        )}
      </svg>
      <p className="text-[13.5px] leading-relaxed text-foreground/90">{text}</p>
    </div>
  )
}

export function GuidesSection({ guides }: { guides: GuideSection[] }) {
  return (
    <>
      {guides.map((guide) => (
        <section
          key={guide.id}
          id={guide.id}
          data-doc-section={guide.id}
          className="scroll-mt-20 border-t border-border py-10 first:border-t-0 first:pt-0"
        >
          <h2 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
            {guide.title}
          </h2>
          <div className="mt-4 max-w-2xl space-y-4">
            {guide.body.map((paragraph, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          {guide.callout && <div className="max-w-2xl"><Callout {...guide.callout} /></div>}
          {guide.code && (
            <div className="mt-5 max-w-2xl">
              <CodeBlock
                code={guide.code.code}
                language={guide.code.code.trim().startsWith("{") ? "json" : "http"}
                title={guide.code.label}
              />
            </div>
          )}
        </section>
      ))}
    </>
  )
}
