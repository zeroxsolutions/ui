import type { ComponentProps, ReactNode } from 'react';

import { ComponentPreviewDemo } from '@/components/data-display/component-preview-demo';
import { ComponentSource } from '@/components/data-display/component-source';
import { Index } from '@/registry/bases/base-ui/examples/__index__';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

interface ComponentPreviewProps extends ComponentProps<typeof Tabs> {
  /** A demo name in the examples index. */
  name: string;
}

/**
 * A demo rendered live under a Preview tab, and its source under a Code tab. Throws for a name the
 * index lacks, so a page naming a missing demo fails its build.
 */
function ComponentPreview({ name, className, ...props }: ComponentPreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);

  return (
    <Tabs data-slot="component-preview" defaultValue="preview" className={cn('gap-3', className)} {...props}>
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="flex min-h-72 items-center justify-center rounded-xl border p-10">
        <ComponentPreviewDemo name={name} />
      </TabsContent>
      <TabsContent value="code">
        <ComponentSource name={name} />
      </TabsContent>
    </Tabs>
  );
}

export { ComponentPreview };
