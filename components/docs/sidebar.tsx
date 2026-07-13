"use client"

import { useMemo, useState } from "react"
import type { NavSection } from "@/lib/docs/spec"

export function Sidebar({
  sections,
  activeId,
  onNavigate,
}: {
  sections: NavSection[]
  activeId: string
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            section.title.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, query])

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4">
        <label htmlFor="doc-search" className="sr-only">
          Search the reference
        </label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="doc-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search endpoints..."
            className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/70 focus:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
      </div>

      <nav
        className="doc-scroll flex-1 overflow-y-auto px-2 pb-8"
        aria-label="API reference"
      >
        {filtered.map((section) => (
          <div key={section.id} className="mb-5">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.id === activeId
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={onNavigate}
                      aria-current={active ? "location" : undefined}
                      className={`block rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors ${
                        active
                          ? "bg-accent/10 font-medium text-accent"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 text-[13px] text-muted-foreground">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        )}
      </nav>
    </div>
  )
}
