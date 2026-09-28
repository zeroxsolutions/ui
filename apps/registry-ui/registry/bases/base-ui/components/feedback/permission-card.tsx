import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** The lifecycle of a consent request - host-driven, like `ToolCallCard`'s state. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

/**
 * PermissionCard - an inline, non-modal AI-consent card for a chat message. The host
 * owns the `status`; the card renders in the message stream (inside
 * `ChatMessage`) and stays in scrollback after it resolves. Compound, not a
 * prop-bag - the consumer composes the parts:
 *
 *   <PermissionCard status={status}>
 *     <PermissionCardHeader>
 *       <Wrench className="size-3.5 text-muted-foreground" />
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <PermissionCardStatus status={status} />
 *     </PermissionCardHeader>
 *     <PermissionCardDescription>Deploy the web app to production</PermissionCardDescription>
 *     <PermissionCardPreview label="Command"><CodeBlock ... /></PermissionCardPreview>
 *     <PermissionCardActions>
 *       <Button variant="ghost" onClick={deny}>Deny</Button>
 *       <ButtonGroup>...Allow once + scopes...</ButtonGroup>   // plain Button for a single scope
 *     </PermissionCardActions>
 *     <PermissionCardResolved><CheckCircle2 className="text-success" /> Allowed once - 2:14pm</PermissionCardResolved>
 *   </PermissionCard>
 *
 * The decision row is asymmetric on purpose (plain `Deny`, graduated-scope
 * `Allow`). `status` sets `data-status` and the parts show/hide by
 * `group-data-[status=...]/permission-card` selectors - no context, no prop-drilled
 * boolean. To foreground rejection for a risky operation the consumer simply
 * gives `Deny` the emphasised button variant - no component-level "tone" chrome.
 */
function PermissionCard({
  status,
  className,
  ...props
}: ComponentProps<'div'> & {
  status: PermissionCardStatusValue;
}) {
  return (
    <div
      data-slot="permission-card"
      data-status={status}
      className={cn(
        // Borderless - the request flows in the assistant message, set off only by
        // spacing and the preview's own frame; no card chrome boxes it, so the code
        // preview spans the full message width (no padding inset squeezing it).
        // Matches Claude's minimal prose+code aesthetic.
        'group/permission-card my-2 flex w-full flex-col gap-3',
        className,
      )}
      {...props}
    />
  );
}

/** The top row: a leading glyph, the title, and the status badge. */
function PermissionCardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="permission-card-header" className={cn('flex items-center gap-2', className)} {...props} />;
}

/** The request's one-line title (e.g. what the assistant wants to do). */
function PermissionCardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="permission-card-title"
      className={cn('min-w-0 flex-1 truncate text-sm font-medium', className)}
      {...props}
    />
  );
}

/** Per-status cue (icon + tone) and the default visible word. */
const STATUS: Record<PermissionCardStatusValue, { label: string; icon: ReactNode }> = {
  pending: { label: 'Needs approval', icon: <Circle /> },
  approved: {
    label: 'Allowed',
    icon: <CheckCircle2 className="text-success" />,
  },
  denied: { label: 'Denied', icon: <XCircle className="text-destructive" /> },
};

/** An understated status cue (small icon + word), keyed off the request's status. */
function PermissionCardStatus({
  status,
  className,
  ...props
}: ComponentProps<'span'> & { status: PermissionCardStatusValue }) {
  const cue = STATUS[status];
  return (
    <span
      data-slot="permission-card-status"
      className={cn(
        'text-muted-foreground ml-auto inline-flex shrink-0 items-center gap-1 text-xs [&_svg]:size-3.5',
        className,
      )}
      {...props}
    >
      {cue.icon}
      {cue.label}
    </span>
  );
}

/** A human-readable one-line summary of what will happen. */
function PermissionCardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="permission-card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/**
 * The preview slot for the exact operation (a command, diff, or payload). A thin
 * wrapper - place a `CodeBlock` inside, which brings its own muted frame, header,
 * and collapse (a `CollapsibleCard` on Base UI `Collapsible`). Deliberately adds no
 * border or second collapsible of its own, so the preview never double-frames.
 */
function PermissionCardPreview({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="permission-card-preview" className={cn('min-w-0', className)} {...props} />;
}

/**
 * The decision row - shown only while `pending`. Asymmetric: a plain `Deny`
 * button and the graduated-scope `Allow` control (a `ButtonGroup` holding a
 * `Button` and a `DropdownMenu`, or a plain `Button` for a single scope).
 */
function PermissionCardActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="permission-card-actions"
      className={cn(
        'hidden items-center justify-end gap-2 group-data-[status=pending]/permission-card:flex',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The persisted outcome - shown once the request is `approved` or `denied`.
 * Non-interactive; stays in the transcript.
 */
function PermissionCardResolved({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="permission-card-resolved"
      className={cn(
        'text-muted-foreground hidden items-center gap-1.5 text-xs group-data-[status=approved]/permission-card:flex group-data-[status=denied]/permission-card:flex',
        className,
      )}
      {...props}
    />
  );
}

export {
  PermissionCard,
  PermissionCardHeader,
  PermissionCardTitle,
  PermissionCardStatus,
  PermissionCardDescription,
  PermissionCardPreview,
  PermissionCardActions,
  PermissionCardResolved,
};
export type { PermissionCardStatusValue };
