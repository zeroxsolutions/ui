import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** The lifecycle of a consent request - host-driven, like `ToolCallCard`'s state. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

/**
 * PermissionCard - an inline, non-modal AI-consent request inside a chat
 * message, which stays in scrollback after it resolves. The host owns
 * `status`; the root carries it as `data-status`, and the parts show, hide
 * and pick their icon from it. Every word is the consumer's:
 *
 *   <PermissionCard status={status}>
 *     <PermissionCardHeader>
 *       <Wrench className="text-muted-foreground size-3.5" />
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <PermissionCardStatus>{statusWord}</PermissionCardStatus>
 *     </PermissionCardHeader>
 *     <CardDescription>Deploy the web app to production</CardDescription>
 *     <CodeBlock code={command} language="bash" />
 *     <PermissionCardActions>
 *       <Button variant="ghost" onClick={deny}>Deny</Button>
 *       <ButtonGroup>...Allow once + scopes...</ButtonGroup>
 *     </PermissionCardActions>
 *     <PermissionCardResolved><CheckCircle2 className="text-success" /> Allowed once - 2:14pm</PermissionCardResolved>
 *   </PermissionCard>
 *
 * The decision row is asymmetric on purpose: a plain `Deny` and a
 * graduated-scope `Allow`. For a risky operation the consumer gives `Deny`
 * the emphasised button variant.
 */
interface PermissionCardProps extends ComponentProps<'div'> {
  status: PermissionCardStatusValue;
}

function PermissionCard({ status, className, ...props }: PermissionCardProps): ReactNode {
  return (
    <div
      data-slot="permission-card"
      data-status={status}
      className={cn('group/permission-card flex w-full flex-col gap-3', className)}
      {...props}
    />
  );
}

/** The top row: a leading glyph, the title and the status. */
function PermissionCardHeader({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return <div data-slot="permission-card-header" className={cn('flex items-center gap-2', className)} {...props} />;
}

/** What the assistant asks to do, on one truncated line. */
function PermissionCardTitle({ className, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div
      data-slot="permission-card-title"
      className={cn('min-w-0 flex-1 truncate text-sm font-medium', className)}
      {...props}
    />
  );
}

/** An understated status cue: its children are the word, its icon follows the root's `data-status`. */
function PermissionCardStatus({ className, children, ...props }: ComponentProps<'span'>): ReactNode {
  return (
    <span
      data-slot="permission-card-status"
      className={cn(
        'text-muted-foreground ml-auto inline-flex shrink-0 items-center gap-1 text-xs [&_svg]:size-3.5',
        className,
      )}
      {...props}
    >
      <Circle aria-hidden className="hidden group-data-[status=pending]/permission-card:block" />
      <CheckCircle2 aria-hidden className="text-success hidden group-data-[status=approved]/permission-card:block" />
      <XCircle aria-hidden className="text-destructive hidden group-data-[status=denied]/permission-card:block" />
      {children}
    </span>
  );
}

/** The decision row, shown only while the request is `pending`. */
function PermissionCardActions({ className, ...props }: ComponentProps<'div'>): ReactNode {
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

/** The persisted outcome, shown once the request is `approved` or `denied`. */
function PermissionCardResolved({ className, ...props }: ComponentProps<'div'>): ReactNode {
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
  PermissionCardActions,
  PermissionCardResolved,
};
export type { PermissionCardStatusValue, PermissionCardProps };
