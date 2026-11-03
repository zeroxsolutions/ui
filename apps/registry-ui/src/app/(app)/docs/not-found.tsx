import type { ReactNode } from 'react';

import { DocsNotFoundPage } from '@zeroxsolutions/ui-docs-web/pages/docs-not-found-page';

import { docsSectionPages } from '@/lib/source';

/** What a docs path the content lacks answers, with its 404, such as a native-only component's counterpart. */
export default function DocsNotFound(): ReactNode {
  const { docs, components } = docsSectionPages();
  return <DocsNotFoundPage docs={docs} components={components} />;
}
