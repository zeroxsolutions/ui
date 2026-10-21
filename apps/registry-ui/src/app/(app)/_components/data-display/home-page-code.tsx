import type { ReactNode } from 'react';

import {
  SourceCodeBlock,
  SourceCodeBlockActions,
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
  SourceCodeBlockHeader,
  SourceCodeBlockLanguage,
  SourceCodeBlockTitle,
} from '@/components/data-display/source-code-block';

/** A short source block on a home page: its language, a copy button and the code, which the block
 * highlights itself on the client, since a home page is no MDX. */
function HomePageCode({ code, language }: { code: string; language: string }): ReactNode {
  return (
    <SourceCodeBlock code={code} language={language}>
      <SourceCodeBlockHeader>
        <SourceCodeBlockTitle>
          <SourceCodeBlockLanguage>{language}</SourceCodeBlockLanguage>
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

export { HomePageCode };
