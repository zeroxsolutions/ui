import type { ReactNode } from 'react';

import {
  SourceCodeCard,
  SourceCodeCardActions,
  SourceCodeCardCode,
  SourceCodeCardContent,
  SourceCodeCardCopy,
  SourceCodeCardFile,
  SourceCodeCardHeader,
  SourceCodeCardLanguage,
  SourceCodeCardTitle,
} from './source-code-card';
import type { HighlightLine } from '../../../../registry/bases/base-ui/lib/shiki';

interface DocsCodeCardProps {
  code: string;
  language?: string;
  /** A file name shown beside the language. */
  title?: string;
  /** Lines highlighted as the page compiled; left out, the block highlights itself once it mounts. */
  lines?: HighlightLine[] | null;
  className?: string;
}

/** A docs page's code block: the language and file over the code, with a copy button. */
function DocsCodeCard({ code, language, title, lines, className }: DocsCodeCardProps): ReactNode {
  return (
    <SourceCodeCard code={code} language={language} lines={lines} className={className}>
      <SourceCodeCardHeader>
        <SourceCodeCardTitle>
          <SourceCodeCardLanguage>{language}</SourceCodeCardLanguage>
          {title ? <SourceCodeCardFile>{title}</SourceCodeCardFile> : null}
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

export { DocsCodeCard };
