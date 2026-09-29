import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

const centerVariants = cva('items-center justify-center', {
  variants: {
    inline: {
      false: 'flex',
      true: 'inline-flex',
    },
  },
  defaultVariants: {
    inline: false,
  },
});

/**
 * Centres its children on both axes. The centring is fixed: a box whose
 * alignment the caller could change would be a flex box, not a centre. `inline`
 * picks inline flow over block flow. Size, spacing and placement (`h-screen`,
 * `gap-2`) come from `className`; `render={<main />}` swaps the element, and
 * its semantics are then the caller's.
 */
function Center({
  className,
  inline,
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof centerVariants>): ReactNode {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(centerVariants({ inline }), className) }, props),
    render,
    state: {
      slot: 'center',
    },
  });
}

export { Center, centerVariants };
