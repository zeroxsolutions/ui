import type { ReactNode } from 'react';

import {
  SourceCodeCard,
  SourceCodeCardActions,
  SourceCodeCardCode,
  SourceCodeCardContent,
  SourceCodeCardCopy,
  SourceCodeCardHeader,
  SourceCodeCardLanguage,
  SourceCodeCardTitle,
} from './source-code-card';

/** A short source block on a home page: its language, a copy button and the code, which the block
 * highlights itself on the client, since a home page is no MDX. */
function HomePageCode({ code, language }: { code: string; language: string }): ReactNode {
  return (
    <SourceCodeCard code={code} language={language}>
      <SourceCodeCardHeader>
        <SourceCodeCardTitle>
          <SourceCodeCardLanguage>{language}</SourceCodeCardLanguage>
        </SourceCodeCardTitle>
        <SourceCodeCardActions>
          <SourceCodeCardCopy />
        </SourceCodeCardActions>
      </SourceCodeCardHeader>
      <SourceCodeCardContent>
        <SourceCodeCardCode />
      </SourceCodeCardContent>
    </SourceCodeCard>
  );
}

export { HomePageCode };
