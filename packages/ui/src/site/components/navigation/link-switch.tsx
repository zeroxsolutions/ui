'use client';

import type { ComponentProps, ReactNode } from 'react';

import { type Host, useHost } from '../../../host/host-provider';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { tabsListVariants } from '../../../../registry/bases/base-ui/ui/tabs';

interface LinkSwitchProps extends ComponentProps<'nav'> {
  /** Names what the links switch. */
  'aria-label': string;
  /** The tabs list's look: `default` a filled track the current link sits raised on, `line` an underline. */
  variant?: 'default' | 'line';
}

/**
 * A row of links to one page in each of several variants, such as its platform or engine, drawn as the
 * style's tabs. The links move the reader rather than switch a panel, so they are links in a `nav`, not a
 * `tablist`, and take the tabs' look only.
 */
function LinkSwitch({ variant = 'default', className, children, ...props }: LinkSwitchProps): ReactNode {
  return (
    // The tabs root's group and orientation, which the list's and the triggers' recipes read.
    <nav
      data-slot="link-switch"
      data-orientation="horizontal"
      data-horizontal=""
      className={cn('group/tabs flex', className)}
      {...props}
    >
      <div data-slot="link-switch-list" data-variant={variant} className={tabsListVariants({ variant })}>
        {children}
      </div>
    </nav>
  );
}

interface LinkSwitchItemProps extends ComponentProps<Host['Link']> {
  /** Whether the page is this variant, which marks the link `aria-current` and draws it as the active tab. */
  current: boolean;
  /**
   * Whether following the link loads its page as a new document, for a page another app serves: a plain
   * anchor rather than the host's link, which would prefetch and navigate on the client to a page its app
   * does not have. The host's link when omitted.
   */
  reloadDocument?: boolean;
}

/** One variant's link in a `LinkSwitch`, drawn as the tabs trigger draws a tab, `data-active` on the current. */
function LinkSwitchItem({ current, reloadDocument = false, className, ...props }: LinkSwitchItemProps): ReactNode {
  const { Link } = useHost();
  const Anchor = reloadDocument ? 'a' : Link;
  return (
    <Anchor
      data-slot="link-switch-item"
      data-active={current ? '' : undefined}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'cn-tabs-trigger relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap text-foreground/60 transition-all hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent',
        'data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground',
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export { LinkSwitch, LinkSwitchItem };
