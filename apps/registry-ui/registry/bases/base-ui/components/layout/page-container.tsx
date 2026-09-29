import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

const pageContainerVariants = cva('mx-auto w-full', {
  variants: {
    /**
     * Max content width, by name from the max-width scale, so a surface never
     * hardcodes one. `mx-auto w-full` centres the column at every size.
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
 * The centred, max-width content column of a full-width surface, so content
 * does not stretch edge to edge on a wide screen. Pick the width with `size`;
 * `className` carries the surface's own padding and vertical rhythm.
 *
 *   <PageContainer size="lg" className="px-6 py-6">...</PageContainer>
 */
function PageContainer({ size, className, ...props }: PageContainerProps): ReactNode {
  return <div data-slot="page-container" className={cn(pageContainerVariants({ size }), className)} {...props} />;
}

export { PageContainer, pageContainerVariants };
export type { PageContainerProps };
