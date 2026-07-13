import type { ReactNode } from "react"
import { CopyButton } from "./copy-button"

/** Minimal, dependency-free JSON token highlighter. */
function highlightJson(code: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const regex =
    /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(\b-?\d+(?:\.\d+)?\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],])/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(<span key={key++}>{code.slice(lastIndex, match.index)}</span>)
    }
    const [full, propKey, str, num, lit, punct] = match
    if (propKey) {
      tokens.push(
        <span key={key++} className="text-sky-300">
          {propKey}
        </span>,
      )
    } else if (str) {
      tokens.push(
        <span key={key++} className="text-emerald-300">
          {str}
        </span>,
      )
    } else if (num) {
      tokens.push(
        <span key={key++} className="text-amber-300">
          {num}
        </span>,
      )
    } else if (lit) {
      tokens.push(
        <span key={key++} className="text-fuchsia-300">
          {lit}
        </span>,
      )
    } else if (punct) {
      tokens.push(
        <span key={key++} className="text-slate-400">
          {punct}
        </span>,
      )
    } else {
      tokens.push(<span key={key++}>{full}</span>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < code.length) {
    tokens.push(<span key={key++}>{code.slice(lastIndex)}</span>)
  }
  return tokens
}

export function CodeBlock({
  code,
  language = "json",
  title,
  copyable = true,
  className = "",
}: {
  code: string
  language?: "json" | "http" | "bash" | "text"
  title?: string
  copyable?: boolean
  className?: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-lg border border-code-border bg-code-bg ${className}`}
    >
      {(title || copyable) && (
        <figcaption className="flex items-center justify-between border-b border-code-border/70 px-3 py-2">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-code-fg/50">
            {title ?? language}
          </span>
          {copyable && <CopyButton value={code} />}
        </figcaption>
      )}
      <pre className="doc-scroll overflow-x-auto px-4 py-3.5 text-[12.5px] leading-relaxed">
        <code className="font-mono text-code-fg">
          {language === "json" ? highlightJson(code) : code}
        </code>
      </pre>
    </figure>
  )
}
