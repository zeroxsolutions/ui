'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useAnimate } from 'motion/react-mini';
import { Children, useEffect, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The home page's component grid: each cell below the fold when the page hydrates starts hidden and
 * eases in as it scrolls into view, about 30ms after the cell to its left in the same row (its row
 * read from the rendered layout, so this holds at every column count the grid reflows to). A cell
 * already on screen at hydration is never hidden, so nothing waits on JS.
 */
function HomeGrid({ className, children, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="home-grid" className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)} {...props}>
      {Children.map(children, (child) => (
        <HomeGridCell>{child}</HomeGridCell>
      ))}
    </div>
  );
}

function HomeGridCell({ children }: { children: ReactNode }): ReactNode {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const box = scope.current.getBoundingClientRect();
    if (box.top < window.innerHeight) return;
    scope.current.dataset.hidden = '';
    animate(scope.current, { opacity: 0, transform: 'translateY(8px)' }, { duration: 0 });
  }, [animate, reduce, scope]);

  useEffect(() => {
    if (!inView || !scope.current || !('hidden' in scope.current.dataset)) return;
    delete scope.current.dataset.hidden;
    const cell = scope.current;
    // A sibling shares this cell's row once the grid has laid both out, regardless of which one of
    // them has eased in yet: `transform` (what easing in animates) never moves a grid track.
    const row = Array.from(cell.parentElement?.children ?? []).filter(
      (sibling) => sibling instanceof HTMLElement && sibling.offsetTop === cell.offsetTop,
    );
    animate(
      cell,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0.2, ease: 'easeOut', delay: Math.max(row.indexOf(cell), 0) * 0.03 },
    );
  }, [animate, inView, scope]);

  return (
    <div ref={scope} data-slot="home-grid-cell" className="min-w-0">
      {children}
    </div>
  );
}

export { HomeGrid };
