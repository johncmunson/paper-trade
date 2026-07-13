"use client"

import { useEffect, useState } from "react"
import type { NavSection } from "@/lib/docs/spec"
import { Sidebar } from "./sidebar"
import { ThemeToggle } from "./theme-toggle"

export function DocShell({
  sections,
  version,
  children,
}: {
  sections: NavSection[]
  version: string
  children: React.ReactNode
}) {
  const [activeId, setActiveId] = useState(sections[0]?.items[0]?.id ?? "")
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-doc-section]"),
    )
    if (targets.length === 0) return

    // The reading line sits just below the sticky header. The active section is
    // the last one whose top has scrolled above this line — i.e. the section you
    // are currently reading. This treats every section identically, including
    // the first one (Introduction), instead of letting a tall earlier section
    // stay stuck as active.
    const marker = 96

    let frame = 0
    const computeActive = () => {
      frame = 0
      let currentId = targets[0].getAttribute("data-doc-section") ?? ""
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= marker) {
          currentId = target.getAttribute("data-doc-section") ?? currentId
        } else {
          break
        }
      }
      setActiveId(currentId)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(computeActive)
    }

    computeActive()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <a href="#introduction" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M17 7h4v4" />
              </svg>
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Paper Trade
              </span>
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                API Reference
              </span>
            </span>
          </a>

          <span className="ml-1 hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">
            v{version}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="#errors"
              className="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Errors
            </a>
            <a
              href="#schemas"
              className="hidden rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Data models
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 border-r border-border pt-6 lg:block xl:w-72">
          <Sidebar sections={sections} activeId={activeId} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-border bg-background pt-5 shadow-xl">
              <div className="flex items-center justify-between px-4 pb-3">
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  Paper Trade
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">
                <Sidebar
                  sections={sections}
                  activeId={activeId}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-10 xl:px-14">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
