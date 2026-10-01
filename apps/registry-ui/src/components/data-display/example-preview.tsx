import type { ReactNode } from 'react';

import { BlockFrame } from '@/components/data-display/block-frame';
import {
  ComponentPreview,
  ComponentPreviewCode,
  ComponentPreviewExcerpt,
  ComponentPreviewSource,
  ComponentPreviewStage,
} from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
import { RegistryExample } from '@/components/data-display/registry-example';
import {
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockLineNumbers,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';
import { publishedBlocks } from '@/lib/registry';
import { Index } from '@/registry/bases/base-ui/examples/__index__';

/** How many of the source's first lines show before `View code`. */
const EXCERPT_LINES = 3;

interface ExamplePreviewProps {
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
 * A docs page's `<ComponentPreview name>`: the demo live above its source; with `view`, that block's
 * own page framed edge to edge instead, so the block lays out at the frame's width. Throws for a name
 * the index lacks or a view that is no published block, so a page naming either fails its build.
 */
function ExamplePreview({ name, view, code, language, lines }: ExamplePreviewProps): ReactNode {
  if (!Index[name]) throw new Error(`ComponentPreview: "${name}" is not in the examples index`);
  const block = view === undefined ? undefined : publishedBlocks.find((item) => item.name === view);
  if (view !== undefined && !block) throw new Error(`ComponentPreview: "${view}" is not a published block`);
  const source = { name, code, language, lines, variant: 'flush' } as const;

  return (
    <ComponentPreview className="mt-4 mb-12">
      {block ? (
        <BlockFrame name={block.name} title={block.title} />
      ) : (
        <ComponentPreviewStage>
          <RegistryExample name={name} />
        </ComponentPreviewStage>
      )}
      <ComponentPreviewSource>
        <ComponentPreviewExcerpt>
          <ComponentSource {...source} maxLines={EXCERPT_LINES}>
            <SourceCodeBlockHeader>
              <SourceCodeBlockTitle>
                <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
              </SourceCodeBlockTitle>
            </SourceCodeBlockHeader>
            <SourceCodeBlockContent>
              <SourceCodeBlockLineNumbers />
              <SourceCodeBlockCode />
            </SourceCodeBlockContent>
          </ComponentSource>
        </ComponentPreviewExcerpt>
        <ComponentPreviewCode>
          <ComponentSource {...source}>
            <SourceCodeBlockHeader>
              <SourceCodeBlockTitle>
                <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
              </SourceCodeBlockTitle>
              <SourceCodeBlockActions>
                <SourceCodeBlockCopy />
              </SourceCodeBlockActions>
            </SourceCodeBlockHeader>
            <SourceCodeBlockContent>
              <SourceCodeBlockLineNumbers />
              <SourceCodeBlockCode />
            </SourceCodeBlockContent>
          </ComponentSource>
        </ComponentPreviewCode>
      </ComponentPreviewSource>
    </ComponentPreview>
  );
}

export { ExamplePreview };
