import { X } from "lucide-react"

import { DirtyDot } from "@/components/dirty-dot"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The trailing control on an editor tab (VS Code behaviour): a dirty tab shows
 * the unsaved dot, which becomes an × close affordance on hover or whenever the
 * tab is active. Always a `Button` (ghost + icon size), never a raw <button>.
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
      size="icon"
      aria-label="Close"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
      className={cn("size-5 rounded-sm", className)}
    >
      {showDot ? <DirtyDot /> : <X className="size-3.5" />}
    </Button>
  )
}

export { TabCloseButton }
