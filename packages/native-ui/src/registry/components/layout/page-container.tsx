import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

const pageContainerVariants = cva('mx-auto w-full', {
  variants: {
    /**
     * Max content width, by name from the max-width scale, so a surface never hardcodes one. `mx-auto
     * w-full` centres the column at every size.
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

type PageContainerProps = ComponentProps<typeof View> & VariantProps<typeof pageContainerVariants>;

/**
 * The centred, max-width content column of a full-width surface, so content does not stretch edge to edge
 * on a tablet held sideways. Pick the width with `size`; `className` carries the surface's own padding and
 * vertical rhythm. It does not scroll, as the web's does not: put it inside the screen's ScrollView.
 *
 *   <ScrollView>
 *     <PageContainer size="lg" className="px-6 py-6">...</PageContainer>
 *   </ScrollView>
 */
function PageContainer({ size, className, ...props }: PageContainerProps): ReactNode {
  return <View className={cn(pageContainerVariants({ size }), className)} {...props} />;
}

export { PageContainer, pageContainerVariants };
export type { PageContainerProps };
