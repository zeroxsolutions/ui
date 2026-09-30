import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreview } from '@/components/data-display/component-preview';
import { publishedBlocks } from '@/lib/registry';
import { source } from '@/lib/source';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Every block the registry publishes, each on its own page in a frame.',
};

export default function BlocksPage(): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground">
          A block is a whole surface composed from this registry&apos;s components. Each is framed at the width of this
          column, so its layout answers to the frame and not to the window.
        </p>
      </header>
      {publishedBlocks.map((block) => {
        const page = source.getPage(['blocks', block.name]);
        return (
          <section key={block.name} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight">
                {page ? (
                  <Link href={page.url} className="underline underline-offset-4">
                    {block.title}
                  </Link>
                ) : (
                  block.title
                )}
              </h2>
              <p className="text-muted-foreground text-sm">{block.description}</p>
            </div>
            <ComponentPreview>
              <BlockFrame name={block.name} title={block.title} />
            </ComponentPreview>
          </section>
        );
      })}
    </div>
  );
}
