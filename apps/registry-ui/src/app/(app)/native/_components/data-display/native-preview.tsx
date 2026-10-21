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
import { EXPO_PROJECT_IDS } from '@/constants/native-preview-device';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';
import type { NativeEngine } from '@/types/native-engine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

import { NativePreviewPlatform, NativePreviewPlatformSelect } from './native-preview-platform';

interface NativePreviewProps {
  /** The engine the page is read under, whose preview app draws the demo; `nativeMdxComponents` sets it. */
  engine: NativeEngine;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/**
 * A native component page's `<NativePreview name>`: the demo drawn live under its Preview tab, its
 * source under its Code tab, and beside the tabs a pick between drawing the demo on the web and a QR code
 * that opens it on a phone, offered only while the page's engine has an Expo project. Its source is read
 * as the page compiles, so it works only inside a native page; anywhere else it throws.
 */
function NativePreview({ engine, name, code, language, lines }: NativePreviewProps): ReactNode {
  if (code === undefined) throw new Error(`NativePreview: "${name}" has no source; only a native page reads it`);

  return (
    <Tabs data-slot="native-preview" defaultValue="preview" className="mt-4 mb-12">
      <div className="flex items-center justify-between gap-2">
        <TabsList variant="line">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        {EXPO_PROJECT_IDS[engine] !== null && <NativePreviewPlatformSelect />}
      </div>
      {/* Kept mounted, so a look at the code and back does not load the frame again. */}
      <TabsContent value="preview" keepMounted className="mt-4">
        <ComponentPreview>
          <NativePreviewPlatform demo={name} engine={engine} />
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
