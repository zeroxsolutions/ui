import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * The centered, max-width content column for full-width surfaces, so content
 * doesn't stretch edge-to-edge on wide screens. Width is `max-w-5xl` (≈1024px);
 * pass `className` for padding or to override the width.
 *
 *   <PageContainer className="px-6 py-6 md:px-8 md:py-8">…</PageContainer>
 */
export function PageContainer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-5xl', className)} {...props} />;
}
