import * as React from "react"

import { cn } from "@/lib/utils"

export type StatusTone = "online" | "offline" | "busy" | "idle"

const TONE_CLASS: Record<StatusTone, string> = {
  online: "bg-success",
  offline: "bg-muted-foreground/30",
  busy: "bg-destructive",
  idle: "bg-warning",
}

/**
 * A small status/presence dot — the shared "coloured circle that signals a
 * binary/presence state". Carries a semantic tone, not a raw colour, so every
 * surface reads the same:
 *
 *   - online  → connected / enabled / active
 *   - offline → disconnected / disabled / off
 *   - busy    → error / unavailable
 *   - idle    → pending / away
 *
 * Not this: an arbitrary identity colour (a team/agent hex) or a "modified"
 * flag (use `DirtyDot`) — those aren't a status.
 */
function StatusDot({
  tone,
  pulse,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  tone: StatusTone
  /** Animate the dot — e.g. "connecting" / "live". */
  pulse?: boolean
}) {
  return (
    <span
      data-slot="status-dot"
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        TONE_CLASS[tone],
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { StatusDot }
