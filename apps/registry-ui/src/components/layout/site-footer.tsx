import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';

/** The strip across the foot of every page: what the registry is built from. */
function SiteFooter({ className, ...props }: ComponentProps<'footer'>): ReactNode {
  return (
    <footer className={cn('border-t', className)} {...props}>
      <p className="text-muted-foreground px-4 py-6 text-center text-sm md:px-6">
        Composed from{' '}
        <a href="https://ui.shadcn.com" className="text-foreground font-medium underline underline-offset-4">
          shadcn/ui
        </a>{' '}
        primitives on{' '}
        <a href="https://base-ui.com" className="text-foreground font-medium underline underline-offset-4">
          Base UI
        </a>
        .
      </p>
    </footer>
  );
}

export { SiteFooter };
