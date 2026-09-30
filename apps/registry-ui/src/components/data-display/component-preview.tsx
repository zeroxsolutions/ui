import type { ComponentProps, ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreviewCard } from '@/components/data-display/component-preview-card';
import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { ComponentSource } from '@/components/data-display/component-source';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

/** How many of the source's first lines the card shows before `View code`. */
const SOURCE_PREVIEW_LINES = 3;

interface ComponentPreviewProps extends Omit<
  ComponentProps<typeof ComponentPreviewCard>,
  'component' | 'source' | 'sourcePreview'
> {
  /** A demo name in the examples index. */
  name: string;
  /** A published block to frame on its own page in place of the demo. */
  view?: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/**
 * A demo rendered live above its source; with `view`, the card frames that block's own page instead,
 * so the block lays out at the frame's width. Throws for a name the index lacks or a view that is no
 * published block, so a page naming either fails its build.
 */
function ComponentPreview({
  name,
  view,
  code,
  language,
  lines,
  previewClassName,
  ...props
}: ComponentPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  const block = view === undefined ? undefined : publishedBlocks.find((item) => item.name === view);
  if (view !== undefined && !block) throw new Error(`ComponentPreview: "${view}" is not a published block`);
  const source = { name, code, language, lines, collapsible: false };

  return (
    <ComponentPreviewCard
      previewClassName={block ? 'h-auto' : previewClassName}
      component={
        block ? (
          <BlockFrame name={block.name} title={block.title} framed={false} />
        ) : (
          <ComponentPreviewDemo name={name} />
        )
      }
      source={<ComponentSource {...source} variant="flush" />}
      sourcePreview={<ComponentSource {...source} variant="flush" header={false} maxLines={SOURCE_PREVIEW_LINES} />}
      {...props}
    />
  );
}

export { ComponentPreview };
