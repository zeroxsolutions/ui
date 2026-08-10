import { X } from "lucide-react"

import { DirtyDot } from "@/registry/bases/base-ui/components/dirty-dot"
import { Button } from "@/registry/bases/base-ui/ui/button"

/**
 * The trailing control on an editor tab (VS Code behaviour): a dirty tab shows
 * the unsaved dot, which becomes an × close affordance on hover or whenever the
 * tab is active. Always a `Button` at its compact `icon-xs` variant (never a raw
 * <button>, and never a `size-*` override — the variant owns the size and its
 * icon size).
 */
export interface TabCloseButtonProps {
  dirty: boolean
  /** Force the × instead of the dot (active tab / row hover). */
  revealClose: boolean
  onClose: () => void
  className?: string
}

function TabCloseButton({
  dirty,
  revealClose,
  onClose,
  className,
}: TabCloseButtonProps) {
  const showDot = dirty && !revealClose
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Close"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
      className={className}
    >
      {showDot ? <DirtyDot /> : <X />}
    </Button>
  )
}

export { TabCloseButton }
