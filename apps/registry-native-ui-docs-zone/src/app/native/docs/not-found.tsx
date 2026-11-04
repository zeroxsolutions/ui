import type { ReactNode } from 'react';

import { NativeNotFoundPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-not-found-page';

import { nativeSectionPages } from '@/lib/native-source';

/** What a native docs path the content lacks answers, with its 404, such as a web docs page's counterpart. */
export default function NativeDocsNotFound(): ReactNode {
  return <NativeNotFoundPage section="Docs" pages={nativeSectionPages('docs')} />;
}
