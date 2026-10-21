import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { buttonVariants } from '@/registry/bases/base-ui/ui/button';

/** A row of links to one page in each of several variants, such as its platform or engine. `aria-label` names what they switch. */
function LinkSwitch({ className, ...props }: ComponentProps<'nav'> & { 'aria-label': string }): ReactNode {
  return (
    <nav data-slot="link-switch" className={cn('bg-muted flex items-center rounded-lg p-0.5', className)} {...props} />
  );
}

interface LinkSwitchItemProps extends ComponentProps<typeof Link> {
  /** Whether the page is this variant, which marks the link `aria-current`. */
  current: boolean;
}

/** One variant's link in a `LinkSwitch`. */
function LinkSwitchItem({ current, className, ...props }: LinkSwitchItemProps): ReactNode {
  return (
    <Link
      data-slot="link-switch-item"
      aria-current={current ? 'page' : undefined}
      className={cn(buttonVariants({ variant: current ? 'outline' : 'ghost', size: 'xs' }), className)}
      {...props}
    />
  );
}

export { LinkSwitch, LinkSwitchItem };
