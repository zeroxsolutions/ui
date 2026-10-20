'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Badge } from '@/registry/bases/base-ui/ui/badge';

/** The viewport edge the bar is fixed to, as shadcn's Sheet names them. */
type TabBarSide = 'top' | 'right' | 'bottom' | 'left';

/** Which labels show: every one, only the active item's, or none. A hidden label is still read. */
type TabBarLabels = 'always' | 'selected' | 'none';

/** `translucent` blurs what scrolls behind it, `solid` covers it. */
type TabBarSurface = 'translucent' | 'solid';

/** `attached` runs edge to edge, `floating` is a pill inset 16px from the edges. */
type TabBarShape = 'attached' | 'floating';

const tabBarVariants = cva('group/tab-bar fixed z-50 flex text-foreground', {
  variants: {
    side: {
      top: 'flex-row items-center justify-between',
      bottom: 'flex-row items-center justify-between',
      left: 'flex-col gap-1',
      right: 'flex-col gap-1',
    },
    surface: {
      translucent: 'bg-background/70 backdrop-blur',
      solid: 'bg-background',
    },
    shape: {
      attached: '',
      floating: 'rounded-full p-1.5 shadow-lg',
    },
  },
  compoundVariants: [
    { shape: 'attached', side: 'top', className: 'inset-x-0 top-0 p-2 shadow-[0_2px_12px_rgb(0_0_0/0.08)]' },
    { shape: 'attached', side: 'bottom', className: 'inset-x-0 bottom-0 p-2 shadow-[0_-2px_12px_rgb(0_0_0/0.08)]' },
    {
      shape: 'attached',
      side: 'left',
      className: 'inset-y-0 left-0 w-22 px-2 py-3 shadow-[2px_0_12px_rgb(0_0_0/0.08)]',
    },
    {
      shape: 'attached',
      side: 'right',
      className: 'inset-y-0 right-0 w-22 px-2 py-3 shadow-[-2px_0_12px_rgb(0_0_0/0.08)]',
    },
    { shape: 'floating', side: 'top', className: 'inset-x-4 top-4' },
    { shape: 'floating', side: 'bottom', className: 'inset-x-4 bottom-4' },
    { shape: 'floating', side: 'left', className: 'inset-y-4 left-4 my-auto h-fit' },
    { shape: 'floating', side: 'right', className: 'inset-y-4 right-4 my-auto h-fit' },
  ],
});

interface TabBarContextValue {
  labels: TabBarLabels;
}

const TabBarContext = React.createContext<TabBarContextValue | null>(null);

function useTabBar(): TabBarContextValue {
  const context = React.useContext(TabBarContext);
  if (!context) throw new Error('TabBar parts must be used within <TabBar>');
  return context;
}

interface TabBarItemContextValue {
  active: boolean;
  badgeId: string;
}

const TabBarItemContext = React.createContext<TabBarItemContextValue | null>(null);

function useTabBarItem(): TabBarItemContextValue {
  const context = React.useContext(TabBarItemContext);
  if (!context) throw new Error('TabBarItem parts must be used within <TabBarItem>');
  return context;
}

interface TabBarProps extends React.ComponentProps<'nav'> {
  /** What the destinations are, such as `Main`; it names the landmark among the page's others. */
  'aria-label': string;
  /** The edge it is fixed to; `bottom` when omitted. Top and bottom lay the items in a row, left and right in a column. */
  side?: TabBarSide;
  /** Which labels show; `always` when omitted. */
  labels?: TabBarLabels;
  /** `translucent` (`bg-background/70 backdrop-blur`) when omitted, or `solid` (`bg-background`). */
  surface?: TabBarSurface;
  /** `attached` when omitted, or `floating`. */
  shape?: TabBarShape;
}

/**
 * A bar of top-level destinations fixed to one edge of the viewport, a `nav` landmark named by
 * `aria-label`. It has no border: the surface separates by blur and shadow. Each destination is a
 * `TabBarItem`, and the current one is `active`:
 *
 *   <TabBar aria-label="Main" labels="selected">
 *     <TabBarItem render={<Link href="/" />} active>
 *       <TabBarIndicator><TabBarIcon><House /></TabBarIcon></TabBarIndicator>
 *       <TabBarLabel>Home</TabBarLabel>
 *     </TabBarItem>
 *   </TabBar>
 *
 * Carries `data-side`, `data-orientation` (`horizontal` or `vertical`), `data-labels`, `data-surface`
 * and `data-shape`.
 */
function TabBar({
  side = 'bottom',
  labels = 'always',
  surface = 'translucent',
  shape = 'attached',
  className,
  ...props
}: TabBarProps): React.ReactNode {
  const context = React.useMemo(() => ({ labels }), [labels]);
  return (
    <TabBarContext.Provider value={context}>
      <nav
        data-slot="tab-bar"
        data-side={side}
        data-orientation={side === 'left' || side === 'right' ? 'vertical' : 'horizontal'}
        data-labels={labels}
        data-surface={surface}
        data-shape={shape}
        className={cn(tabBarVariants({ side, surface, shape }), className)}
        {...props}
      />
    </TabBarContext.Provider>
  );
}

interface TabBarItemProps extends useRender.ComponentProps<'a'> {
  /** The destination on show: `aria-current="page"`, the lit indicator, and the label kept by `labels="selected"`. */
  active?: boolean;
}

/**
 * One destination, an `<a>` unless `render` passes the router's own link, such as
 * `render={<Link href="/inbox" />}`, so it navigates on the client. Its name is its `TabBarLabel`, and a
 * `TabBarBadge` describes it. Carries `data-active` when active.
 */
function TabBarItem({ active = false, className, render, ...props }: TabBarItemProps): React.ReactNode {
  const badgeId = React.useId();
  const context = React.useMemo(() => ({ active, badgeId }), [active, badgeId]);
  const element = useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'group/tab-bar-item relative flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 p-1 text-muted-foreground outline-none select-none group-data-[orientation=horizontal]/tab-bar:flex-1 data-active:text-primary',
          className,
        ),
      },
      props,
      // An id that names no element adds nothing to the description, so an item without a badge is not
      // described.
      { 'aria-describedby': [props['aria-describedby'], badgeId].filter(Boolean).join(' ') },
    ),
    state: { slot: 'tab-bar-item', active },
    stateAttributesMapping: { active: (value) => (value ? { 'data-active': '' } : null) },
  });
  return <TabBarItemContext.Provider value={context}>{element}</TabBarItemContext.Provider>;
}

/**
 * The pill behind the icon: tinted while its item is active, muted while pressed, and ringed while the
 * item has keyboard focus. Holds the `TabBarIcon` and any `TabBarBadge`. Carries `data-active`.
 */
function TabBarIndicator({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  const { active } = useTabBarItem();
  return (
    <span
      data-slot="tab-bar-indicator"
      data-active={active ? '' : undefined}
      className={cn(
        'relative flex h-8 w-14 items-center justify-center rounded-full transition-colors group-focus-visible/tab-bar-item:ring-2 group-focus-visible/tab-bar-item:ring-ring group-active/tab-bar-item:not-data-active:bg-muted data-active:bg-primary/10',
        className,
      )}
      {...props}
    />
  );
}

/** Holds the destination's glyph at 20px, hidden from a screen reader, which reads the label. */
function TabBarIcon({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  return (
    <span
      data-slot="tab-bar-icon"
      aria-hidden
      className={cn('flex size-5 items-center justify-center [&_svg]:size-5 [&_svg]:shrink-0', className)}
      {...props}
    />
  );
}

interface TabBarBadgeProps extends Omit<React.ComponentProps<typeof Badge>, 'variant'> {
  /**
   * The words a screen reader hears after the count, `new` when omitted, so `3` describes its item as
   * "3 new". A string because a screen reader reads it and an app translates it.
   */
  countLabel?: string;
}

/**
 * Upstream's destructive `Badge` at the indicator's top right, holding a count. It is kept out of the
 * item's name and describes the item instead, so a screen reader hears "Inbox, link, 3 new".
 */
function TabBarBadge({ countLabel = 'new', className, children, ...props }: TabBarBadgeProps): React.ReactNode {
  const { badgeId } = useTabBarItem();
  return (
    <Badge
      data-slot="tab-bar-badge"
      id={badgeId}
      variant="destructive"
      aria-hidden
      className={cn('absolute -top-1 left-1/2 ml-1', className)}
      {...props}
    >
      {children}
      <span className="sr-only"> {countLabel}</span>
    </Badge>
  );
}

/**
 * The destination's name, `text-xs font-medium`. Where the bar's `labels` hides it, it is visually
 * hidden and still names the item; it then carries `data-hidden`.
 */
function TabBarLabel({ className, ...props }: React.ComponentProps<'span'>): React.ReactNode {
  const { labels } = useTabBar();
  const { active } = useTabBarItem();
  const hidden = labels === 'none' || (labels === 'selected' && !active);
  return (
    <span
      data-slot="tab-bar-label"
      data-hidden={hidden ? '' : undefined}
      className={cn('text-xs font-medium data-hidden:sr-only', className)}
      {...props}
    />
  );
}

export { TabBar, TabBarItem, TabBarIndicator, TabBarIcon, TabBarBadge, TabBarLabel };
export type { TabBarSide, TabBarLabels, TabBarSurface, TabBarShape };
