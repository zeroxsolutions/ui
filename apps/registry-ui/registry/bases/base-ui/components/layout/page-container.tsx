import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

const pageContainerVariants = cva('mx-auto w-full', {
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

interface PageContainerProps extends ComponentProps<'div'>, VariantProps<typeof pageContainerVariants> {}

/**
 * The centred, max-width content column for a full-width surface, so content
 * doesn't stretch edge-to-edge on wide screens. Pick the width with `size`
 * (don't hardcode a `max-w-*`); `className` is for the surface's own padding /
 * vertical rhythm.
 *
 *   <PageContainer size="lg" className="px-6 py-6">...</PageContainer>
 */
function PageContainer({ size, className, ...props }: PageContainerProps) {
  return <div data-slot="page-container" className={cn(pageContainerVariants({ size }), className)} {...props} />;
}

export { PageContainer, pageContainerVariants };
export type { PageContainerProps };
