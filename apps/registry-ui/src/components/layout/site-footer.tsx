import type { ReactNode } from 'react';

/** The strip across the foot of every page but a docs page, which hides it as upstream's does: what the registry is built from. */
function SiteFooter(): ReactNode {
  return (
    <footer className="group-has-[[data-slot=docs]]/body:hidden">
      <div className="container-wrapper px-4 xl:px-6">
        <div className="flex h-(--footer-height) items-center justify-between">
          <div className="text-muted-foreground w-full px-1 text-center text-xs leading-loose sm:text-sm">
            Composed from{' '}
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              shadcn/ui
            </a>{' '}
            primitives on{' '}
            <a
              href="https://base-ui.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Base UI
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
