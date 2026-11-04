'use client';

import type { ReactNode } from 'react';

import { useHost } from '@zeroxsolutions/ui/host';
import { SectionNotFound } from '@zeroxsolutions/ui/site/components/feedback/section-not-found';

import { componentRoute, componentsRoute } from '../routes';

interface DocsNotFoundPageProps {
  /** The docs pages outside the components, in reading order, which a missing docs path lists. */
  docs: readonly { title: string; url: string }[];
  /** The component pages, their index first, which a missing component path lists. */
  components: readonly { title: string; url: string }[];
}

/**
 * The docs' 404: the section the missing path sits in, the components or the rest of the docs, listed
 * in place of the page asked for, which the native platform switch links to without knowing whether
 * the web has it.
 */
function DocsNotFoundPage({ docs, components }: DocsNotFoundPageProps): ReactNode {
  const pathname = useHost().usePathname();
  const component = componentRoute.matcher(pathname) || componentsRoute.matcher(pathname);

  return component ? (
    <SectionNotFound section="Components" pages={components} />
  ) : (
    <SectionNotFound section="Docs" pages={docs} />
  );
}

export { DocsNotFoundPage };
