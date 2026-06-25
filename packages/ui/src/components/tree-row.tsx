import { ChevronRight } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The shared skeleton of one row in a hierarchy tree (a layer tree, a scene
 * outliner, a file tree). It owns only what such trees share:
 *
 * - the row container as a flex `group` (so trailing actions reveal on
 *   `group-hover:`),
 * - depth indent (`baseIndent + depth * indentStep` px of left padding),
 * - the disclosure control: a chevron that rotates 90° when `expanded`, or a
 *   same-width spacer for leaves so names stay aligned.
 *
 * Everything that legitimately differs is caller-owned and passes through, so no
 * consumer's look is forced onto another:
 *
 * - selection/hover COLOUR and row height → `className` (one tree may want a
 *   fixed height for virtualization, another auto height),
 * - the icon, the name (or an inline-rename input), trailing actions → `children`,
 * - drag/drop handlers, `draggable`, `onContextMenu`, etc. → spread onto the row.
 *
 * `ref` reaches the row div — a consumer needs it for `scrollIntoView` and so a
 * wrapping Base UI `render` trigger (e.g. a context menu) can compose its ref.
 */
export interface TreeRowProps extends ComponentProps<"div"> {
  /** Nesting depth; 0 for roots. Drives the left indent. */
  depth: number
  /** Pixels of indent added per depth level. Default 12. */
  indentStep?: number
  /** Pixels of indent at depth 0. Default 0. */
  baseIndent?: number
  /** Whether the node has children — shows the chevron vs. a spacer. */
  hasChildren: boolean
  /** Whether the node is expanded — rotates the chevron and sets the a11y label. */
  expanded: boolean
  /** Toggle expand/collapse. The chevron stops propagation so it never selects. */
  onToggleExpand: () => void
  /** a11y label for the disclosure control when collapsed. */
  expandLabel?: string
  /** a11y label for the disclosure control when expanded. */
  collapseLabel?: string
  children: ReactNode
}

function TreeRow({
  depth,
  indentStep = 12,
  baseIndent = 0,
  hasChildren,
  expanded,
  onToggleExpand,
  expandLabel = "Expand",
  collapseLabel = "Collapse",
  className,
  style,
  children,
  ...rest
}: TreeRowProps) {
  return (
    <div
      // The shared row rhythm: rounded-md, a gap before trailing actions, and a
      // hair of right padding. Callers override any of these via `className`
      // (cn = tailwind-merge) and own selection/hover COLOUR + row height.
      className={cn("group flex items-center gap-1 rounded-md pr-1", className)}
      style={{ paddingLeft: baseIndent + depth * indentStep, ...style }}
      {...rest}
    >
      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={expanded ? collapseLabel : expandLabel}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform", expanded && "rotate-90")}
          />
        </Button>
      ) : (
        <span className="w-5 shrink-0" aria-hidden />
      )}
      {children}
    </div>
  )
}

export { TreeRow }
