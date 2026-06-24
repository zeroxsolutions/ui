import type { ComponentType } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * An icon-only form label with a hover tooltip — for dense panels that label
 * fields with an icon (no verbose text) and reveal the meaning on hover. Use
 * for a field's `label` slot where space is tight.
 */
function IconLabel({
  icon: Icon,
  tip,
}: {
  icon: ComponentType<{ className?: string }>
  tip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="flex items-center text-muted-foreground" />}
      >
        <Icon className="size-3" />
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

export { IconLabel }
