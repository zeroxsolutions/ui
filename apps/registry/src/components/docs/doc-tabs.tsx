'use client';

import type { ReactNode } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@zeroxsolutions/ui/components/ui/tabs';

export type DocTabValue = 'preview' | 'code' | 'props' | 'composition';

export interface DocTabsProps {
  /** The live Preview panel. */
  preview: ReactNode;
  /** The Code/Usage panel - usually `<UsageCode>`. */
  code: ReactNode;
  /** The Props panel - usually `<PropsTable>`. */
  propsTable: ReactNode;
  /** The Composition panel - usually `<CompositionTree>`. */
  composition: ReactNode;
}

/**
 * The Preview / Code / Props / Composition tab switcher every doc page uses,
 * composed on the shipped `Tabs` primitive. Preview is the default tab so the
 * live render is what a reader sees first.
 */
export function DocTabs({
  preview,
  code,
  propsTable,
  composition,
}: DocTabsProps) {
  return (
    <Tabs defaultValue="preview" className="w-full">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="props">Props</TabsTrigger>
        <TabsTrigger value="composition">Composition</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" data-slot="doc-tab-preview">
        {preview}
      </TabsContent>
      <TabsContent value="code" data-slot="doc-tab-code">
        {code}
      </TabsContent>
      <TabsContent value="props" data-slot="doc-tab-props">
        {propsTable}
      </TabsContent>
      <TabsContent value="composition" data-slot="doc-tab-composition">
        {composition}
      </TabsContent>
    </Tabs>
  );
}
