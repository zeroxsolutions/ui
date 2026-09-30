import type { ComponentProps, ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { ComponentPreviewTabs } from '@/components/data-display/component-preview-tabs';
import { ComponentSource } from '@/components/data-display/component-source';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

interface ComponentPreviewProps extends Omit<
  ComponentProps<typeof ComponentPreviewTabs>,
  'component' | 'source' | 'sourcePreview'
> {
  /** A demo name in the examples index. */
  name: string;
  /** A published block to frame on its own page in place of the demo. */
  view?: string;
}

/**
 * A demo rendered live above its source, upstream's `ComponentPreview`; with `view`, the card frames
 * that block's own page instead, so the block lays out at the frame's width. Throws for a name the
 * index lacks or a view that is no published block, so a page naming either fails its build.
 */
function ComponentPreview({ name, view, previewClassName, ...props }: ComponentPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  const block = view === undefined ? undefined : publishedBlocks.find((item) => item.name === view);
  if (view !== undefined && !block) throw new Error(`ComponentPreview: "${view}" is not a published block`);

  return (
    <ComponentPreviewTabs
      // A framed block fills the card edge to edge, as upstream's chromeless preview does.
      previewClassName={block ? 'h-auto p-0' : previewClassName}
      component={
        block ? (
          <BlockFrame name={block.name} title={block.title} className="rounded-none border-0" />
        ) : (
          <ComponentPreviewDemo name={name} />
        )
      }
      source={<ComponentSource name={name} collapsible={false} />}
      sourcePreview={<ComponentSource name={name} collapsible={false} maxLines={3} />}
      {...props}
    />
  );
}

export { ComponentPreview };
