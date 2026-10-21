import type { ReactNode } from 'react';

import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockFile,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';
import type { HighlightLine } from '@/registry/bases/base-ui/lib/shiki';

interface DocsCodeBlockProps {
  code: string;
  language?: string;
  /** A file name shown beside the language. */
  title?: string;
  /** Lines highlighted as the page compiled; left out, the block highlights itself once it mounts. */
  lines?: HighlightLine[] | null;
  className?: string;
}

/** A docs page's code block: the language and file over the code, with a copy button. */
function DocsCodeBlock({ code, language, title, lines, className }: DocsCodeBlockProps): ReactNode {
  return (
    <SourceCodeBlock code={code} language={language} lines={lines} className={className}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
          {title ? <SourceCodeBlockFile>{title}</SourceCodeBlockFile> : null}
        </SourceCodeBlockTitle>
        <SourceCodeBlockActions>
          <SourceCodeBlockCopy />
        </SourceCodeBlockActions>
      </SourceCodeBlockHeader>
      <SourceCodeBlockContent>
        <SourceCodeBlockCode />
      </SourceCodeBlockContent>
    </SourceCodeBlock>
  );
}

export { DocsCodeBlock };
