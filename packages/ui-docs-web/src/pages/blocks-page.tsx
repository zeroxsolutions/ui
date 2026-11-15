import type { ReactNode } from 'react';

import { BlockFrame } from '@zeroxsolutions/ui/site/components/data-display/block-frame';
import { ComponentPreview } from '@zeroxsolutions/ui/site/components/data-display/component-preview';
import { HostLink } from '@zeroxsolutions/ui/site/components/navigation/host-link';

import { BaseSwitcher } from '../components/navigation/base-switcher';
import { publishedBlocks } from '../lib/published-items';
import { docsPageRoute, viewRoute } from '../routes';

interface BlocksPageProps {
  /** `href`, a docs URL a route built, where the docs have a page there; `undefined` where none is written yet. */
  writtenDocsPage(href: string): string | undefined;
}

/** Every block the registry publishes, each framed under its title, which links to its docs page where one is written. */
function BlocksPage({ writtenDocsPage }: BlocksPageProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground">
          A block is a page-level template, such as a dashboard or a sign-in page, composed from this registry&apos;s
          components. Each is framed at the width of this column, so its layout answers to the frame and not to the
          window.
        </p>
        <BaseSwitcher className="mt-4" />
      </header>
      {publishedBlocks.length === 0 && <p>No blocks yet.</p>}
      {publishedBlocks.map((block) => {
        const url = writtenDocsPage(docsPageRoute.build({ slug: `blocks/${block.name}` }));
        return (
          <section key={block.name} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">
                {url ? (
                  <HostLink href={url} className="underline underline-offset-4">
                    {block.title}
                  </HostLink>
                ) : (
                  block.title
                )}
              </h2>
              <p className="text-muted-foreground text-sm">{block.description}</p>
            </div>
            <ComponentPreview>
              <BlockFrame src={viewRoute.build({ name: block.name })} title={block.title} />
            </ComponentPreview>
          </section>
        );
      })}
    </div>
  );
}

export { BlocksPage };
