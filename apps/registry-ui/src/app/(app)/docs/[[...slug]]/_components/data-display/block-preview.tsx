import type { ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreview } from '@/components/data-display/component-preview';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

import { ExampleSource } from './example-source';

interface BlockPreviewProps {
  /** The demo whose source shows under the frame. */
  name: string;
  /** The published block the frame shows, on its own page, so it lays out at the frame's width. */
  block: string;
  code?: string;
  language?: string;
  lines?: string;
}

/** A docs page's `<BlockPreview name block>`: the block framed edge to edge above its demo's source. Throws for a name or a block the registry lacks. */
function BlockPreview({ name, block, ...source }: BlockPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`BlockPreview: "${name}" is not in the examples index`);
  const item = publishedBlocks.find((entry) => entry.name === block);
  if (!item) throw new Error(`BlockPreview: "${block}" is not a published block`);
  return (
    <ComponentPreview className="mt-4 mb-12">
      <BlockFrame name={item.name} title={item.title} />
      <ExampleSource name={name} {...source} />
    </ComponentPreview>
  );
}

export { BlockPreview };
