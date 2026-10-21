import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { EngineSwitcher } from '@/components/navigation/engine-switcher';
import { DEFAULT_COMPONENT_BASE } from '@/constants/component-bases';
import { NATIVE_ENGINES } from '@/constants/native-engines';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';
import { blocksRoute } from '@/routes/app-routes';

export const dynamic = 'force-static';

// An engine outside the set answers 404.
export const dynamicParams = false;

export function generateStaticParams(): { engine: string }[] {
  return NATIVE_ENGINES.map((engine) => ({ engine }));
}

export const metadata: Metadata = {
  title: 'Native blocks',
  description: 'The blocks the registry publishes for React Native: none yet.',
};

export default function NativeBlocksPage(): ReactNode {
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
            The registry publishes no React Native block yet. The{' '}
            <Link href={blocksRoute.build({ base: DEFAULT_COMPONENT_BASE })}>web blocks</Link> are composed from the web
            components.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
