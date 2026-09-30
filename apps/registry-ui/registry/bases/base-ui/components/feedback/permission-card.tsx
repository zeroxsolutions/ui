import { Circle, CircleX } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Card, CardAction, CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import { CircleCheckIcon } from '@/registry/bases/base-ui/ui/circle-check';

/** The lifecycle of a consent request - host-driven, like `ToolCallCard`'s state. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

interface PermissionCardProps extends ComponentProps<typeof Card> {
  status: PermissionCardStatusValue;
}

/**
 * PermissionCard - an inline, non-modal AI-consent request inside a chat
 * message, which stays in scrollback after it resolves. It is a `Card`,
 * small by default. The host owns `status`; the root carries it as
 * `data-status`, and the parts show, hide and pick their icon from it. Every
 * word is the consumer's:
 *
 *   <PermissionCard status={status}>
 *     <PermissionCardHeader>
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <CardDescription>Deploy the web app to production</CardDescription>
 *       <PermissionCardStatus>{statusWord}</PermissionCardStatus>
 *     </PermissionCardHeader>
 *     <CardContent><CodeBlock code={command} language="bash" /></CardContent>
 *     <PermissionCardActions>
 *       <Button variant="ghost" onClick={deny}>Deny</Button>
 *       <ButtonGroup>...Allow once + scopes...</ButtonGroup>
 *     </PermissionCardActions>
 *     <PermissionCardResolved>
 *       <CardDescription>Allowed once - 2:14pm</CardDescription>
 *     </PermissionCardResolved>
 *   </PermissionCard>
 *
 * The decision row is asymmetric on purpose: a plain `Deny` and a
 * graduated-scope `Allow`. For a risky operation the consumer gives `Deny`
 * the emphasised button variant.
 */
function PermissionCard({ status, size = 'sm', className, ...props }: PermissionCardProps): ReactNode {
  return (
    <Card
      data-slot="permission-card"
      data-status={status}
      size={size}
      className={cn('group/permission-card', className)}
      {...props}
    />
  );
}

/** The card's header: the title, an optional `CardDescription`, and the status at its end. */
function PermissionCardHeader(props: ComponentProps<typeof CardHeader>): ReactNode {
  return <CardHeader {...props} />;
}

/** What the assistant asks to do, on one truncated line. */
function PermissionCardTitle({ className, ...props }: ComponentProps<typeof CardTitle>): ReactNode {
  return <CardTitle className={cn('min-w-0 truncate', className)} {...props} />;
}

/**
 * A `Badge` in the header's action slot, `outline` unless the consumer passes
 * another `variant` (`destructive` for a denied request): its children are the
 * status word, and its icon follows the root's `data-status`.
 */
function PermissionCardStatus({ children, ...props }: ComponentProps<typeof Badge>): ReactNode {
  return (
    <CardAction>
      <Badge data-slot="permission-card-status" variant="outline" {...props}>
        <Circle aria-hidden className="hidden group-data-[status=pending]/permission-card:block" />
        <CircleCheckIcon aria-hidden size={12} className="hidden group-data-[status=approved]/permission-card:block" />
        <CircleX aria-hidden className="hidden group-data-[status=denied]/permission-card:block" />
        {children}
      </Badge>
    </CardAction>
  );
}

/** The decision row, a `CardFooter` shown only while the request is `pending`. */
function PermissionCardActions({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  return (
    <CardFooter
      className={cn(
        'justify-end gap-2 group-data-[status=approved]/permission-card:hidden group-data-[status=denied]/permission-card:hidden',
        className,
      )}
      {...props}
    />
  );
}

/** The persisted outcome, a `CardFooter` shown once the request is `approved` or `denied`. */
function PermissionCardResolved({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  return (
    <CardFooter className={cn('gap-2 group-data-[status=pending]/permission-card:hidden', className)} {...props} />
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
