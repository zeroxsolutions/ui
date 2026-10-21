import type { ReactNode } from 'react';

import { ComponentPreview } from '@/components/data-display/component-preview';
import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockFile,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockLineNumbers,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

import { NativePreviewFrame } from './native-preview-frame';

interface NativePreviewProps {
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/**
 * A native component page's `<NativePreview name>`: the demo drawn live under its Preview tab, and its
 * source under its Code tab. Its source is read as the page compiles, so it works only inside a native
 * page; anywhere else it throws.
 */
function NativePreview({ name, code, language, lines }: NativePreviewProps): ReactNode {
  if (code === undefined) throw new Error(`NativePreview: "${name}" has no source; only a native page reads it`);

  return (
    <Tabs data-slot="native-preview" defaultValue="preview" className="mt-4 mb-12">
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      {/* Kept mounted, so a look at the code and back does not load the frame again. */}
      <TabsContent value="preview" keepMounted className="mt-4">
        <ComponentPreview>
          <NativePreviewFrame demo={name} />
        </ComponentPreview>
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <SourceCodeBlock
          code={code}
          language={language}
          lines={lines ? (JSON.parse(lines) as HighlightLine[] | null) : null}
        >
          <SourceCodeBlockHeader>
            <SourceCodeBlockTitle>
              <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
              <SourceCodeBlockFile>{`${name}.tsx`}</SourceCodeBlockFile>
            </SourceCodeBlockTitle>
            <SourceCodeBlockActions>
              <SourceCodeBlockCopy />
            </SourceCodeBlockActions>
          </SourceCodeBlockHeader>
          <SourceCodeBlockContent>
            <SourceCodeBlockLineNumbers />
            <SourceCodeBlockCode />
          </SourceCodeBlockContent>
        </SourceCodeBlock>
      </TabsContent>
    </Tabs>
  );
}

export { NativePreview };
