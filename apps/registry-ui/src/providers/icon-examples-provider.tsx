'use client';

import { RegistryExamplesProvider } from '@zeroxsolutions/ui/site/components/data-display/registry-example';
import type { ReactNode } from 'react';

import { IconComponents } from '@/registry/bases/base-ui/examples/__icon-components__';

/**
 * Holds the animated icons for the Icons page's grid, in place of the demos the app's providers hold. The icons
 * are a map of their own, kept out of every other page's bundle; a demo rendered inside this provider is not found.
 */
function IconExamplesProvider({ children }: { children: ReactNode }): ReactNode {
  return <RegistryExamplesProvider components={IconComponents}>{children}</RegistryExamplesProvider>;
}

export { IconExamplesProvider };
