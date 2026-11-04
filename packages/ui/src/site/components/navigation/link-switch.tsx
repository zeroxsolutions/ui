'use client';

import type { ComponentProps, ReactNode } from 'react';

import { type Host, useHost } from '../../../host/host-provider';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { buttonVariants } from '../../../../registry/bases/base-ui/ui/button';

/** A row of links to one page in each of several variants, such as its platform or engine. `aria-label` names what they switch. */
function LinkSwitch({ className, ...props }: ComponentProps<'nav'> & { 'aria-label': string }): ReactNode {
  return (
    <nav data-slot="link-switch" className={cn('bg-muted flex items-center rounded-lg p-0.5', className)} {...props} />
  );
}

interface LinkSwitchItemProps extends ComponentProps<Host['Link']> {
  /** Whether the page is this variant, which marks the link `aria-current`. */
  current: boolean;
  /**
   * Whether following the link loads its page as a new document, for a page another app serves: a plain
   * anchor rather than the host's link, which would prefetch and navigate on the client to a page its app
   * does not have. The host's link when omitted.
   */
  reloadDocument?: boolean;
}

/** One variant's link in a `LinkSwitch`. */
function LinkSwitchItem({ current, reloadDocument = false, className, ...props }: LinkSwitchItemProps): ReactNode {
  const { Link } = useHost();
  const Anchor = reloadDocument ? 'a' : Link;
  return (
    <Anchor
      data-slot="link-switch-item"
      aria-current={current ? 'page' : undefined}
      className={cn(buttonVariants({ variant: current ? 'outline' : 'ghost', size: 'xs' }), className)}
      {...props}
    />
  );
}

export { LinkSwitch, LinkSwitchItem };
