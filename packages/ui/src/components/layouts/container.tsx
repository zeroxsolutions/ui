import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const containerVariants = cva('mx-auto w-full', {
  variants: {
    /**
     * Max content width. Binds the max-width scale so a surface picks a width by
     * name instead of hardcoding one - `mx-auto w-full` centres it either way.
     */
    size: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface ContainerProps
  extends ComponentProps<'div'>,
    VariantProps<typeof containerVariants> {}

/**
 * The centred, max-width content column for a full-width surface, so content
 * doesn't stretch edge-to-edge on wide screens. Pick the width with `size`
 * (don't hardcode a `max-w-*`); `className` is for the surface's own padding /
 * vertical rhythm.
 *
 *   <Container size="lg" className="px-6 py-6">...</Container>
 */
function Container({ size, className, ...props }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
}

export { Container, containerVariants };
