'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { platformLocation } from '@/lib/platform-nav';

function FooterLink({ href, children }: { href: string; children: ReactNode }): ReactNode {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
      {children}
    </a>
  );
}

/** The strip across the foot of every page but a docs page, which hides it as upstream's does: what the current platform's registry is built from. */
function SiteFooter(): ReactNode {
  const { platform } = platformLocation(usePathname());
  return (
    <footer data-slot="site-footer" className="group-has-[[data-slot=docs]]/body:hidden">
      <div className="mx-auto w-full px-4 xl:px-6">
        <div className="flex h-(--footer-height) items-center justify-between">
          <div className="text-muted-foreground w-full px-1 text-center text-xs leading-loose sm:text-sm">
            {platform === 'native' ? (
              <>
                Composed from <FooterLink href="https://ui.shadcn.com">shadcn/ui</FooterLink> primitives on{' '}
                <FooterLink href="https://www.npmjs.com/org/rn-primitives">rn-primitives</FooterLink>, styled with{' '}
                <FooterLink href="https://www.nativewind.dev">NativeWind</FooterLink> or{' '}
                <FooterLink href="https://uniwind.dev">Uniwind</FooterLink>.
              </>
            ) : (
              <>
                Composed from <FooterLink href="https://ui.shadcn.com">shadcn/ui</FooterLink> primitives on{' '}
                <FooterLink href="https://base-ui.com">Base UI</FooterLink>.
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
