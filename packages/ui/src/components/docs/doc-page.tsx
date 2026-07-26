import type { ReactNode } from "react"

import { OnThisPage, type TocItem } from "./on-this-page"

export interface DocNavLink {
  href: string
  title: string
}

export interface DocPageProps {
  /** Page title - rendered as the `<h1>`. */
  title: string
  /** One-line description under the title. */
  description: string
  /** Right-rail "On this page" entries, derived from the page's sections. */
  toc: TocItem[]
  /**
   * The main body - the PreviewCode hero, Installation, Usage, and the
   * optional Examples section, each already composed by the page.
   */
  children: ReactNode
  /** Optional paging - the previous doc entry. */
  prev?: DocNavLink
  /** Optional paging - the next doc entry. */
  next?: DocNavLink
}

/**
 * The preview-page body (intended to sit inside a consuming app's shell - e.g.
 * a `SidebarInset`). A two-column region: the main content (title + body +
 * prev/next paging) and a right `OnThisPage` rail that hides below `lg`. It
 * carries no sidebar and no `<main>` - the app's shell owns the landmark - so
 * this is a plain `<div>`. Pagination uses plain anchors to keep the package
 * free of a router dependency; a Next host gets full-page nav between doc
 * pages (acceptable for static docs).
 */
export function DocPage({
  title,
  description,
  toc,
  children,
  prev,
  next,
}: DocPageProps) {
  return (
    <div
      data-slot="doc-page"
      className="mx-auto w-full max-w-6xl px-4 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10"
    >
      <div data-slot="doc-page-main" className="min-w-0">
        <header data-slot="doc-page-header" className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-2 text-base text-muted-foreground">{description}</p>
          ) : null}
        </header>

        <div data-slot="doc-page-body" className="flex flex-col gap-10">
          {children}
        </div>

        {(prev || next) && (
          <nav
            aria-label="Pagination"
            data-slot="doc-page-pagination"
            className="mt-12 flex items-stretch justify-between gap-4 border-t pt-6"
          >
            {prev ? (
              <a
                href={prev.href}
                data-slot="doc-page-prev"
                className="group flex flex-col gap-0.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
              >
                <span className="text-xs text-muted-foreground">Previous</span>
                <span className="font-medium text-foreground group-hover:underline">
                  {prev.title}
                </span>
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a
                href={next.href}
                data-slot="doc-page-next"
                className="group flex flex-col items-end gap-0.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted"
              >
                <span className="text-xs text-muted-foreground">Next</span>
                <span className="font-medium text-foreground group-hover:underline">
                  {next.title}
                </span>
              </a>
            ) : null}
          </nav>
        )}
      </div>

      <aside data-slot="doc-page-toc" className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto py-8">
          <OnThisPage items={toc} />
        </div>
      </aside>
    </div>
  )
}
