import type { ReactNode } from 'react';

import { DEFAULT_NATIVE_ENGINE } from '@zeroxsolutions/ui/site/constants/native-engines';
import { NativeNotFoundPage } from '@zeroxsolutions/native-ui-docs-web/pages/native-not-found-page';
import { nativeBlocksRoute, nativeComponentsRoute, nativeDocsRoute } from '@zeroxsolutions/native-ui-docs-web/routes';

/**
 * What a native page answers with its 404 where no section of its own does, such as a components or
 * blocks path under an engine nobody publishes: the native sections. A path no route matches at all
 * answers the root's not-found instead.
 */
export default function NativeNotFound(): ReactNode {
  const engine = DEFAULT_NATIVE_ENGINE;
  const sections = [
    { title: 'Docs', url: nativeDocsRoute.build() },
    { title: 'Components', url: nativeComponentsRoute.build({ engine }) },
    { title: 'Blocks', url: nativeBlocksRoute.build({ engine }) },
  ];
  return <NativeNotFoundPage section="Native" pages={sections} />;
}
