import type { ReactNode } from 'react';

import { NativeDocsLayoutPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-docs-layout-page';
import { nativePageTree } from '@/lib/native-source';

export default function NativeDocsLayout({ children }: { children: ReactNode }): ReactNode {
  const trees = { nativewind: nativePageTree('nativewind'), uniwind: nativePageTree('uniwind') };
  return <NativeDocsLayoutPage trees={trees}>{children}</NativeDocsLayoutPage>;
}
