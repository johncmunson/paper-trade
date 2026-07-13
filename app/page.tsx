import {
  apiInfo,
  guides,
  groups,
  schemas,
  errorCodes,
  navSections,
} from "@/lib/docs/spec"
import { DocShell } from "@/components/docs/doc-shell"
import { GuidesSection } from "@/components/docs/guides-section"
import { Operation } from "@/components/docs/operation"
import { SchemasSection, ErrorsSection } from "@/components/docs/reference-sections"
import { CodeBlock } from "@/components/docs/code-block"

export default function Home() {
  return (
    <DocShell sections={navSections} version={apiInfo.version}>
      {/* Hero */}
      <section className="pb-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            REST &middot; JSON
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            v{apiInfo.version}
          </span>
        </div>
        <h1 className="mt-4 text-pretty text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {apiInfo.title}
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {apiInfo.description}
        </p>
        <div className="mt-6 max-w-2xl">
          <CodeBlock
            code={`# Base URL\nhttps://api.papertrade.example\n\n# Every business operation is authenticated\nAuthorization: Bearer <credential>`}
            language="bash"
            title="Base URL"
          />
        </div>
      </section>

      {/* Getting started guides */}
      <GuidesSection guides={guides} />

      {/* Endpoint groups */}
      {groups.map((group) => (
        <div key={group.id}>
          <div
            id={group.id}
            className="scroll-mt-20 border-t border-border pt-10"
          >
            <h2 className="text-pretty text-2xl font-semibold tracking-tight text-foreground">
              {group.tag}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {group.description}
            </p>
          </div>
          <div>
            {group.operations.map((op) => (
              <Operation key={op.id} op={op} />
            ))}
          </div>
        </div>
      ))}

      {/* Reference */}
      <SchemasSection schemas={schemas} />
      <ErrorsSection errors={errorCodes} />

      <footer className="border-t border-border py-10 text-[13px] text-muted-foreground">
        <p>
          {apiInfo.title} &middot; v{apiInfo.version}. This reference is generated
          from the service&apos;s OpenAPI specification.
        </p>
      </footer>
    </DocShell>
  )
}
