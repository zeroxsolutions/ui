import type { ReactNode } from 'react';

import { NativeNotFoundPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-not-found-page';

import { nativeSectionPages } from '@/lib/native-source';

/** What a native component path the content lacks answers, with its 404, such as a web-only component's counterpart. */
export default function NativeComponentsNotFound(): ReactNode {
  return <NativeNotFoundPage section="Components" pages={nativeSectionPages('components')} />;
}
