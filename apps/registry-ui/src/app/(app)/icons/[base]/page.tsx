import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { COMPONENT_BASES } from '@zeroxsolutions/ui/site/constants/component-bases';
import { IconsPage } from '@zeroxsolutions/ui-docs-web/pages/icons-page';

export const dynamic = 'force-static';

// A base outside the set answers 404 rather than rendering the icons under a base nobody publishes.
export const dynamicParams = false;

export function generateStaticParams(): { base: string }[] {
  return COMPONENT_BASES.map((base) => ({ base }));
}

export const metadata: Metadata = {
  title: 'Icons',
  description: 'Every animated icon the registry publishes, with the line that installs it.',
};

export default function Page(): ReactNode {
  return <IconsPage />;
}
