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
  SourceCodeBlockTrigger,
} from '@/components/data-display/source-code-block';

import { ComponentSource } from './component-source';

/**
 * How many of the source's first lines show before `View code`. `ComponentPreviewSource`'s
 * `--component-preview-excerpt-height` is this excerpt's own measured height, so a change here needs
 * that measurement retaken.
 */
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
 * A demo's source under its preview: one block with its language, copy button and toggle, showing
 * its first lines until `View code` opens it to the whole file; the header's own trigger closes it
 * again. The header is the same open and closed.
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
            <SourceCodeBlockTrigger />
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
        <SourceCodeBlockContent className="h-(--collapsible-panel-height) transition-[height] duration-200 ease-out data-ending-style:h-(--component-preview-excerpt-height) data-starting-style:h-(--component-preview-excerpt-height) motion-reduce:transition-none">
          <SourceCodeBlockLineNumbers />
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>
    </ComponentPreviewSource>
  );
}

export { ExampleSource };
