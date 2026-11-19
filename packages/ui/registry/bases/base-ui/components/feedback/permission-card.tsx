'use client';

import { createContext, useContext, useRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Card, CardAction, CardFooter, CardTitle } from '@/registry/bases/base-ui/ui/card';
import { CircleCheckIcon } from '@/registry/bases/base-ui/icons/lucide/circle-check-icon';
import { CircleIcon } from '@/registry/bases/base-ui/icons/lucide/circle-icon';
import { CircleXIcon } from '@/registry/bases/base-ui/icons/lucide/circle-x-icon';
import { usePlayWhile, type AnimatedIconHandle } from '@/registry/bases/base-ui/hooks/use-animated-icon';

/** The lifecycle of a consent request; the host sets it, and nothing inside the card changes it. */
type PermissionCardStatusValue = 'pending' | 'approved' | 'denied';

/** The status the surrounding card is in, which `PermissionCardStatus` reads to play the icon it shows. */
const PermissionCardStatusContext = createContext<PermissionCardStatusValue | null>(null);

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
 *     <CardHeader>
 *       <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
 *       <CardDescription>Deploy the web app to production</CardDescription>
 *       <PermissionCardStatus>{statusWord}</PermissionCardStatus>
 *     </CardHeader>
 *     <CardContent>
 *       <CodeCard code={command} language="bash"><CodeCardContent><CodeCardCode /></CodeCardContent></CodeCard>
 *     </CardContent>
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
    <PermissionCardStatusContext.Provider value={status}>
      <Card
        data-slot="permission-card"
        data-status={status}
        size={size}
        className={cn(
          'group/permission-card',
          'has-data-[slot=permission-card-actions]:pb-0 has-data-[slot=permission-card-resolved]:pb-0',
          'data-[size=sm]:has-data-[slot=permission-card-actions]:pb-0 data-[size=sm]:has-data-[slot=permission-card-resolved]:pb-0',
          className,
        )}
        {...props}
      />
    </PermissionCardStatusContext.Provider>
  );
}

/** What the assistant asks to do, on one truncated line. */
function PermissionCardTitle({ className, ...props }: ComponentProps<typeof CardTitle>): ReactNode {
  return <CardTitle data-slot="permission-card-title" className={cn('min-w-0 truncate', className)} {...props} />;
}

/**
 * A `Badge` in the header's action slot, `outline` unless the consumer passes
 * another `variant` (`destructive` for a denied request): its children are the
 * status word, and its icon follows the root's `data-status`.
 */
function PermissionCardStatus({ children, ...props }: ComponentProps<typeof Badge>): ReactNode {
  const status = useContext(PermissionCardStatusContext);
  const pending = useRef<AnimatedIconHandle>(null);
  const approved = useRef<AnimatedIconHandle>(null);
  const denied = useRef<AnimatedIconHandle>(null);
  // Each icon plays once as its status begins; the card draws all three and shows one.
  usePlayWhile(pending, status === 'pending');
  usePlayWhile(approved, status === 'approved');
  usePlayWhile(denied, status === 'denied');
  return (
    <CardAction>
      <Badge data-slot="permission-card-status" variant="outline" {...props}>
        {/* Badge sizes only its direct svg children; an animated icon's svg sits inside the icon's own span, so `size` gives it the Badge's icon size. */}
        <CircleIcon
          ref={pending}
          data-icon="inline-start"
          aria-hidden
          size={12}
          className="hidden group-data-[status=pending]/permission-card:inline-flex"
        />
        <CircleCheckIcon
          ref={approved}
          data-icon="inline-start"
          aria-hidden
          size={12}
          className="hidden group-data-[status=approved]/permission-card:inline-flex"
        />
        <CircleXIcon
          ref={denied}
          data-icon="inline-start"
          aria-hidden
          size={12}
          className="hidden group-data-[status=denied]/permission-card:inline-flex"
        />
        {children}
      </Badge>
    </CardAction>
  );
}

/**
 * The decision row, a `CardFooter` shown only while the request is `pending`.
 * It sets its own `data-slot="permission-card-actions"`; the root reads that
 * slot (and `permission-card-resolved`) to drop a footer's bottom padding, in
 * place of upstream's `card-footer`.
 */
function PermissionCardActions({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  return (
    <CardFooter
      data-slot="permission-card-actions"
      className={cn(
        'justify-end gap-2 group-data-[status=approved]/permission-card:hidden group-data-[status=denied]/permission-card:hidden',
        className,
      )}
      {...props}
    />
  );
}

/**
 * The persisted outcome, a `CardFooter` shown once the request is `approved` or
 * `denied`. Like `PermissionCardActions`, it sets its own `data-slot`
 * (`permission-card-resolved`) in place of upstream's `card-footer`.
 */
function PermissionCardResolved({ className, ...props }: ComponentProps<typeof CardFooter>): ReactNode {
  return (
    <CardFooter
      data-slot="permission-card-resolved"
      className={cn('gap-2 group-data-[status=pending]/permission-card:hidden', className)}
      {...props}
    />
  );
}

export { PermissionCard, PermissionCardTitle, PermissionCardStatus, PermissionCardActions, PermissionCardResolved };
export type { PermissionCardStatusValue, PermissionCardProps };
