import * as SeparatorPrimitive from '@rn-primitives/separator';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../lib/utils';

const separatorVariants = cva('shrink-0 bg-border', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px self-stretch',
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
