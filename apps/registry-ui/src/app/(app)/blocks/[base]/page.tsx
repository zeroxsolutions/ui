import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { COMPONENT_BASES } from '@zeroxsolutions/ui/site/constants/component-bases';
import { BlocksPage } from '@zeroxsolutions/ui-docs-web/pages/blocks-page';
import { writtenDocsPage } from '@/lib/source';

export const dynamic = 'force-static';

// A base outside the set answers 404 rather than rendering the blocks under a base nobody publishes.
export const dynamicParams = false;

export function generateStaticParams(): { base: string }[] {
  return COMPONENT_BASES.map((base) => ({ base }));
}

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Every block the registry publishes, each on its own page in a frame.',
};

export default function Page(): ReactNode {
  return <BlocksPage writtenDocsPage={writtenDocsPage} />;
}
