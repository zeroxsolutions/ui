"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export interface TocItem {
  /** Anchor id of the section heading this entry links to. */
  id: string
  /** Label rendered in the TOC. */
  title: string
  /** Depth - `1` is a top-level section, `2` nests under its parent. */
  depth?: 1 | 2
}

export interface OnThisPageProps {
  items: TocItem[]
}

/**
 * The right-rail "On this page" table of contents. Each entry is an in-page
 * anchor that scrolls to its section; an `IntersectionObserver` watches the
 * section headings and highlights the one currently in view.
 */
export function OnThisPage({ items }: OnThisPageProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (items.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0% -70% 0%", threshold: 0 },
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  return (
    <nav data-slot="on-this-page" aria-label="On this page" className="text-sm">
      <p className="mb-2 font-medium text-foreground">On this page</p>
      <ul className="flex flex-col gap-1 border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              data-slot="on-this-page-link"
              data-active={activeId === item.id}
              className={cn(
                "-ml-px block border-l-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
                item.depth === 2 ? "pl-6" : "pl-3",
                activeId === item.id &&
                  "border-foreground font-medium text-foreground",
                activeId !== item.id && "border-transparent",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
