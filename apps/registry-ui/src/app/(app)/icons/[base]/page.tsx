import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { publishedIconBases } from '@zeroxsolutions/ui-docs-web/lib/published-items';
import { IconsPage } from '@zeroxsolutions/ui-docs-web/pages/icons-page';

export const dynamic = 'force-static';

// A base with no icons answers 404 rather than rendering icons drawn on another base.
export const dynamicParams = false;

export function generateStaticParams(): { base: string }[] {
  return publishedIconBases.map((base) => ({ base }));
}

export const metadata: Metadata = {
  title: 'Icons',
  description: 'Every animated icon the registry publishes, with the line that installs it.',
};

export default function Page(): ReactNode {
  return <IconsPage />;
}
