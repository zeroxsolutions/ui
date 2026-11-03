import type { ReactNode } from 'react';

import { HomePage } from '@zeroxsolutions/ui-docs-web/pages/home-page';
import { writtenDocsPage } from '@/lib/source';

export default function Page(): ReactNode {
  return <HomePage writtenDocsPage={writtenDocsPage} />;
}
