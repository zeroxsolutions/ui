'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useAnimate } from 'motion/react-mini';
import { Children, useEffect, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * The home page's component grid: each cell below the fold when the page hydrates starts hidden and
 * eases in as it scrolls into view, a beat after the cell before it in its row. A cell already on
 * screen at hydration is never hidden, so nothing waits on JS.
 */
function HomeGrid({ className, children, ...props }: ComponentProps<'div'>): ReactNode {
  return (
    <div data-slot="home-grid" className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)} {...props}>
      {Children.map(children, (child, index) => (
        <HomeGridCell index={index}>{child}</HomeGridCell>
      ))}
    </div>
  );
}

/** One grid cell. `index` is its position among its siblings, which sets its stagger within a row. */
function HomeGridCell({ index, children }: { index: number; children: ReactNode }): ReactNode {
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
    // The grid is 3 columns from `lg:grid-cols-3` up (2 below it); cycling the stagger on 3 keeps a
    // row easing in left to right about 30ms apart at the widest breakpoint, and still staggers,
    // just not strictly by row, at 2 columns and at 1.
    animate(
      scope.current,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0.2, ease: 'easeOut', delay: (index % 3) * 0.03 },
    );
  }, [animate, inView, index, scope]);

  return (
    <div ref={scope} data-slot="home-grid-cell">
      {children}
    </div>
  );
}

export { HomeGrid };
