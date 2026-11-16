import type { ReactNode } from 'react';

import { SectionNotFound } from '@zeroxsolutions/ui/site/components/feedback/section-not-found';

import { docsSectionPages } from '@/lib/source';

/** What an editor docs path the content lacks answers, with its 404: the editor pages. */
export default function EditorDocsNotFound(): ReactNode {
  return <SectionNotFound section="Editor" pages={docsSectionPages()} />;
}
