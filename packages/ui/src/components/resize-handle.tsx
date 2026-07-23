import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react"

import { cn } from "@/lib/utils"
import { shouldStartDrag } from "@/lib/resize-drag"

/**
 * A vertical resize grip for a side or floating panel. Stable by design: a
 * resize only begins once the pointer crosses a small movement threshold, so a
 * click, jitter, or double-click never nudges the width. Uses pointer capture so
 * the drag survives the pointer leaving the 1px grip, and `preventDefault` +
 * `touch-action: none` so it never steals focus or selects text. Double-click
 * fires `onToggle` (e.g. collapse/expand the panel).
 */
export interface ResizeHandleProps extends React.ComponentProps<'div'> {
  /** Width delta in px since the last move; apply it to the panel size. */
  onDrag: (dx: number) => void
  /** Double-click action (e.g. collapse/expand the panel). */
  onToggle: () => void
}

function ResizeHandle({ onDrag, onToggle, className, ...props }: ResizeHandleProps) {
  const downX = useRef(0)
  const lastX = useRef(0)
  const armed = useRef(false)
  const dragging = useRef(false)

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    armed.current = true
    dragging.current = false
    downX.current = e.clientX
    lastX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!armed.current) return
      if (!dragging.current) {
        // Don't resize until the pointer has moved past the threshold - a click,
        // jitter, or double-click leaves the width untouched.
        if (!shouldStartDrag(downX.current, e.clientX)) return
        dragging.current = true
        lastX.current = e.clientX
      }
      const dx = e.clientX - lastX.current
      lastX.current = e.clientX
      if (dx !== 0) onDrag(dx)
    },
    [onDrag],
  )

  const end = useCallback(() => {
    armed.current = false
    dragging.current = false
  }, [])

  return (
    <div
      data-slot="resize-handle"
      className={cn(
        "group/handle relative z-40 flex w-px shrink-0 cursor-col-resize touch-none select-none items-center justify-center bg-border transition-colors after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-primary/50 active:bg-primary",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onDoubleClick={onToggle}
      {...props}
    >
      <div className="z-10 flex h-8 w-1 shrink-0 rounded-full bg-border transition-colors group-hover/handle:bg-primary/50" />
    </div>
  )
}

export { ResizeHandle }
