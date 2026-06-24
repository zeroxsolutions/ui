import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A compact monospace pill for short code-ish values — an id, a token count,
 * a hex. Pass `title` so a width-capped (`truncate`) chip still reveals its
 * full value on hover.
 */
function MonoChip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="mono-chip"
      className={cn(
        "inline-flex h-5 items-center rounded-[5px] bg-muted px-1.5 font-mono text-[11px]",
        className
      )}
      {...props}
    />
  )
}

export { MonoChip }
