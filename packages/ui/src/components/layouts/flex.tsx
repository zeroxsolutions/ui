import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Flex — a flexbox container atom. Exposes the flex CONTAINER properties as CVA
 * variants (`direction` / `align` / `justify` / `wrap` / `gap` / `inline`), each
 * mapping 1:1 to a Tailwind utility; this is the faithful intersection of Radix
 * Themes, Mantine and Chakra Flex re-expressed Tailwind-native.
 *
 * Deliberately excluded: flex-ITEM properties (`grow` / `shrink` / `basis`) —
 * those belong on the child, set via its own `className`, not on the container;
 * outer spacing, sizing and placement — the consumer's via `className`. Breakpoint
 * responsiveness is Tailwind prefixes in `className` (`md:flex-row`), not a
 * responsive-object prop. `gap` is a curated subset of Tailwind's spacing scale
 * (the prop value IS the Tailwind step) — a finite enum is required for static
 * class extraction; for a step outside it pass `className="gap-…"`.
 *
 * Spreads `...props` and forwards `ref` (React 19 ref-as-prop) onto its single
 * primary element; polymorphic through the Base UI `render` prop (`render={<ul />}`).
 */
const flexVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      nowrap: 'flex-nowrap',
      wrap: 'flex-wrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
    },
    inline: {
      false: 'flex',
      true: 'inline-flex',
    },
  },
  defaultVariants: {
    direction: 'row',
    inline: false,
  },
});

function Flex({
  className,
  direction,
  align,
  justify,
  wrap,
  gap,
  inline,
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof flexVariants>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          flexVariants({ direction, align, justify, wrap, gap, inline }),
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: 'flex',
    },
  });
}

export { Flex, flexVariants };
