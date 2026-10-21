'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, type ComponentProps, type ReactNode } from 'react';

import { useHydrated } from '@/hooks/use-hydrated';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A row of underlined text links to one page in each of its variants, such as its engine or base, under
 * the page's title. `aria-label` names what they switch.
 */
function LinkTabs({ className, ...props }: ComponentProps<'nav'> & { 'aria-label': string }): ReactNode {
  return <nav data-slot="link-tabs" className={cn('flex items-center gap-6', className)} {...props} />;
}

interface LinkTabsItemProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  /** This page under the item's variant; the link adds the page's query, such as its `?style=`. */
  path: string;
  /** Whether the page is this variant, which marks the link `aria-current`. */
  current: boolean;
}

/** One variant's link in a `LinkTabs`. */
function LinkTabsItem(props: LinkTabsItemProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered link carries no query.
    <Suspense fallback={<LinkTabsItemLink {...props} search="" />}>
      <LinkTabsItemFromUrl {...props} />
    </Suspense>
  );
}

function LinkTabsItemFromUrl(props: LinkTabsItemProps): ReactNode {
  const search = useSearchParams().toString();
  // A page rendered once at build holds no query, and hydration keeps the server's href over the client's.
  return <LinkTabsItemLink {...props} search={useHydrated() ? search : ''} />;
}

function LinkTabsItemLink({
  path,
  current,
  search,
  className,
  ...props
}: LinkTabsItemProps & { search: string }): ReactNode {
  return (
    <Link
      data-slot="link-tabs-item"
      href={search ? `${path}?${search}` : path}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground focus-visible:ring-ring/50 relative inline-flex rounded-sm outline-none focus-visible:ring-[3px] items-center pt-1 pb-0.5 text-base font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity aria-[current=page]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export { LinkTabs, LinkTabsItem };
