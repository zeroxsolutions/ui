import type { ComponentProps, ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { ComponentSource } from '@/components/data-display/component-source';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

interface ComponentPreviewProps extends ComponentProps<typeof Tabs> {
  /** A demo name in the examples index. */
  name: string;
  /** A published block to show under the Preview tab on its own page, in a frame, in place of the demo. */
  view?: string;
}

/**
 * A demo rendered live under a Preview tab, and its source under a Code tab; with `view`, the Preview
 * tab frames that block's own page instead, so the block lays out at the frame's width. Throws for a
 * name the index lacks or a view that is no published block, so a page naming either fails its build.
 */
function ComponentPreview({ name, view, className, ...props }: ComponentPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  const block = view === undefined ? undefined : publishedBlocks.find((item) => item.name === view);
  if (view !== undefined && !block) throw new Error(`ComponentPreview: "${view}" is not a published block`);

  return (
    <Tabs data-slot="component-preview" defaultValue="preview" className={cn('gap-3', className)} {...props}>
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      {block ? (
        <TabsContent value="preview">
          <BlockFrame name={block.name} title={block.title} />
        </TabsContent>
      ) : (
        <TabsContent value="preview" className="flex min-h-72 items-center justify-center rounded-xl border p-10">
          <ComponentPreviewDemo name={name} />
        </TabsContent>
      )}
      <TabsContent value="code">
        <ComponentSource name={name} />
      </TabsContent>
    </Tabs>
  );
}

export { ComponentPreview };
