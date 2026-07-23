import { CheckCircle2, Circle, XCircle } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** The lifecycle of a consent request - host-driven, like `Tool`'s state. */
export type PermissionStatusValue = "pending" | "approved" | "denied"

/**
 * Permission - an inline, non-modal AI-consent card for a chat message. The host
 * owns the `status`; the card renders in the message stream (inside
 * `ChatMessage`) and stays in scrollback after it resolves. Compound, not a
 * prop-bag - the consumer composes the parts:
 *
 *   <Permission status={status}>
 *     <PermissionHeader>
 *       <Wrench className="size-3.5 text-muted-foreground" />
 *       <PermissionTitle>Run deploy.sh</PermissionTitle>
 *       <PermissionStatus status={status} />
 *     </PermissionHeader>
 *     <PermissionDescription>Deploy the web app to production</PermissionDescription>
 *     <PermissionPreview label="Command"><CodeBlock ... /></PermissionPreview>
 *     <PermissionActions>
 *       <Button variant="ghost" onClick={deny}>Deny</Button>
 *       <SplitButton>...Allow once + scopes...</SplitButton>   // plain Button for a single scope
 *     </PermissionActions>
 *     <PermissionResolved><CheckCircle2 className="text-success" /> Allowed once - 2:14pm</PermissionResolved>
 *   </Permission>
 *
 * The decision row is asymmetric on purpose (plain `Deny`, graduated-scope
 * `Allow`). `status` sets `data-status` and the parts show/hide by
 * `group-data-[status=...]/permission` selectors - no context, no prop-drilled
 * boolean. To foreground rejection for a risky operation the consumer simply
 * gives `Deny` the emphasised button variant - no component-level "tone" chrome.
 */
function Permission({
  status,
  className,
  ...props
}: ComponentProps<"div"> & {
  status: PermissionStatusValue
}) {
  return (
    <div
      data-slot="permission"
      data-status={status}
      className={cn(
        // Borderless - the request flows in the assistant message, set off only by
        // spacing and the preview's own frame; no card chrome boxes it, so the code
        // preview spans the full message width (no padding inset squeezing it).
        // Matches Claude's minimal prose+code aesthetic.
        "group/permission my-2 flex w-full flex-col gap-3",
        className
      )}
      {...props}
    />
  )
}

/** The top row: a leading glyph, the title, and the status badge. */
function PermissionHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-header"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

/** The request's one-line title (e.g. what the assistant wants to do). */
function PermissionTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-title"
      className={cn("min-w-0 flex-1 truncate text-sm font-medium", className)}
      {...props}
    />
  )
}

/** Per-status cue (icon + tone) and the default visible word. */
const STATUS: Record<PermissionStatusValue, { label: string; icon: ReactNode }> = {
  pending: { label: "Needs approval", icon: <Circle /> },
  approved: {
    label: "Allowed",
    icon: <CheckCircle2 className="text-success" />,
  },
  denied: { label: "Denied", icon: <XCircle className="text-destructive" /> },
}

/** An understated status cue (small icon + word), keyed off the request's status. */
function PermissionStatus({
  status,
  className,
  ...props
}: ComponentProps<"span"> & { status: PermissionStatusValue }) {
  const cue = STATUS[status]
  return (
    <span
      data-slot="permission-status"
      className={cn(
        "ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground [&_svg]:size-3.5",
        className
      )}
      {...props}
    >
      {cue.icon}
      {cue.label}
    </span>
  )
}

/** A human-readable one-line summary of what will happen. */
function PermissionDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * The preview slot for the exact operation (a command, diff, or payload). A thin
 * wrapper - place a `CodeBlock` inside, which brings its own muted frame, header,
 * and collapse (a `Disclosure` on Base UI `Collapsible`). Deliberately adds no
 * border or second collapsible of its own, so the preview never double-frames.
 */
function PermissionPreview({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-preview"
      className={cn("min-w-0", className)}
      {...props}
    />
  )
}

/**
 * The decision row - shown only while `pending`. Asymmetric: a plain `Deny`
 * button and the graduated-scope `Allow` control (a `SplitButton`, or a plain
 * `Button` for a single scope).
 */
function PermissionActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-actions"
      className={cn(
        "hidden items-center justify-end gap-2 group-data-[status=pending]/permission:flex",
        className
      )}
      {...props}
    />
  )
}

/**
 * The persisted outcome - shown once the request is `approved` or `denied`.
 * Non-interactive; stays in the transcript.
 */
function PermissionResolved({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="permission-resolved"
      className={cn(
        "hidden items-center gap-1.5 text-xs text-muted-foreground group-data-[status=approved]/permission:flex group-data-[status=denied]/permission:flex",
        className
      )}
      {...props}
    />
  )
}

export {
  Permission,
  PermissionHeader,
  PermissionTitle,
  PermissionStatus,
  PermissionDescription,
  PermissionPreview,
  PermissionActions,
  PermissionResolved,
}
