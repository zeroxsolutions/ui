import type { ReactNode } from 'react';

import { ComponentPreview } from '@zeroxsolutions/ui/site/components/data-display/component-preview';
import { HostLink } from '@zeroxsolutions/ui/site/components/navigation/host-link';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import { NativePreviewFrame } from '../components/data-display/native-preview-frame';
import { EngineSwitcher } from '../components/navigation/engine-switcher';
import { nativeBlocks } from '../lib/native-blocks';

interface NativeBlocksPageProps {
  /** The engine the page is read under, whose preview app draws each block. */
  engine: NativeEngine;
  /** The URL of the native page of the item `name` under `engine`; `undefined` where none is written yet. */
  componentPage(name: string): string | undefined;
}

/**
 * Every block the native registry publishes on one engine, each drawn under its title, which links to its page
 * where one is written.
 */
function NativeBlocksPage({ engine, componentPage }: NativeBlocksPageProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <p className="text-muted-foreground">
          A block is a whole surface composed from this registry&apos;s components. Each is drawn at the width of this
          column, so its layout answers to the frame and not to the window.
        </p>
        <EngineSwitcher className="mt-4" />
      </header>
      {nativeBlocks.map((block) => {
        const url = componentPage(block.name);
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
              <NativePreviewFrame engine={engine} demo={`${block.name}-demo`} />
            </ComponentPreview>
          </section>
        );
      })}
    </div>
  );
}

export { NativeBlocksPage };
