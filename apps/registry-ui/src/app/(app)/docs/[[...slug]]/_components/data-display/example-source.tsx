import type { ReactNode } from 'react';

import { ComponentPreviewExcerpt, ComponentPreviewSource } from '@/components/data-display/component-preview';
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

import { ComponentSource } from './component-source';

/** How many of the source's first lines show before `View code`. */
const EXCERPT_LINES = 3;

interface ExampleSourceProps {
  /** A demo name in the examples index. */
  name: string;
  /** The demo's source, its language and its lines as JSON, which `rehypeDocsCode` sets as the page compiles. */
  code?: string;
  language?: string;
  lines?: string;
}

/**
 * A demo's source under its preview: one block with its language and copy button, showing its first
 * lines until `View code` opens it to the whole file. The header is the same open and closed.
 */
function ExampleSource({ name, code, language, lines }: ExampleSourceProps): ReactNode {
  const source = { name, code, language, lines, variant: 'flush' } as const;
  return (
    <ComponentPreviewSource>
      <ComponentSource {...source} defaultOpen={false}>
        <SourceCodeBlockHeader>
          <SourceCodeBlockTitle>
            <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
          </SourceCodeBlockTitle>
          <SourceCodeBlockActions>
            <SourceCodeBlockCopy />
          </SourceCodeBlockActions>
        </SourceCodeBlockHeader>
        <ComponentPreviewExcerpt>
          <ComponentSource {...source} maxLines={EXCERPT_LINES}>
            <SourceCodeBlockContent>
              <SourceCodeBlockLineNumbers />
              <SourceCodeBlockCode />
            </SourceCodeBlockContent>
          </ComponentSource>
        </ComponentPreviewExcerpt>
        <SourceCodeBlockContent>
          <SourceCodeBlockLineNumbers />
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>
    </ComponentPreviewSource>
  );
}

export { ExampleSource };
