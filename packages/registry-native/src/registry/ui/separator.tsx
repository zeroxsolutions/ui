import * as SeparatorPrimitive from '@rn-primitives/separator';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.
const separatorVariants = cva('cn-separator', {
  variants: {
    orientation: {
      horizontal: 'cn-separator-horizontal',
      vertical: 'cn-separator-vertical',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

type SeparatorProps = ComponentProps<typeof SeparatorPrimitive.Root> & VariantProps<typeof separatorVariants>;

/**
 * A rule between two groups of content, one pixel thick in the border colour. It is
 * `decorative` by default and hidden from assistive technology; pass `decorative={false}` when it
 * marks a real boundary a screen reader should announce.
 */
function Separator({ className, orientation = 'horizontal', decorative = true, ...props }: SeparatorProps): ReactNode {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation ?? undefined}
      decorative={decorative}
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  );
}

export { Separator, separatorVariants };
export type { SeparatorProps };
