import type { ReactNode } from 'react';

import {
  ComponentPreviewCode,
  ComponentPreviewExcerpt,
  ComponentPreviewSource,
} from '@/components/data-display/component-preview';
import { ComponentSource } from '@/components/data-display/component-source';
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

/** A demo's source under its preview: its first lines, and the whole file once `View code` opens it. */
function ExampleSource({ name, code, language, lines }: ExampleSourceProps): ReactNode {
  const source = { name, code, language, lines, variant: 'flush' } as const;
  return (
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
  );
}

export { ExampleSource };
