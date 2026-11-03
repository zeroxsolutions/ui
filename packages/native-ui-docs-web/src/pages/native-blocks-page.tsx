import type { ReactNode } from 'react';

import { HostLink } from '@zeroxsolutions/ui/site/components/navigation/host-link';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@zeroxsolutions/ui/registry/bases/base-ui/ui/empty';

import { EngineSwitcher } from '../components/navigation/engine-switcher';

interface NativeBlocksPageProps {
  /** The web blocks page, which the empty state points to. */
  webBlocksHref: string;
}

/** The native blocks on one engine: an empty state until the registry publishes a native block. */
function NativeBlocksPage({ webBlocksHref }: NativeBlocksPageProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <EngineSwitcher />
      </header>
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No native blocks yet</EmptyTitle>
          <EmptyDescription>
            The registry publishes no React Native block yet. The <HostLink href={webBlocksHref}>web blocks</HostLink>{' '}
            are composed from the web components.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

export { NativeBlocksPage };
