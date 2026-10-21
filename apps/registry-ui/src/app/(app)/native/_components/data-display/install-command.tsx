'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { useRememberedEngine } from '@/hooks/use-remembered-choice';
import { registryStyle } from '@/lib/style-choice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

interface InstallCommandProps {
  /** The registry item's name. */
  name: string;
  /** The engine the page is read under, which a native component page binds; absent, the engine the reader last read. */
  engine?: NativeEngine;
  /** The origin the registry is served from, which the MDX components bind. */
  origin: string;
}

/**
 * The command that adds a native item: by its `@zui` name, or by its URL in the engine and the style the
 * page shows, for an app without the `@zui` entry.
 */
function InstallCommand({ name, engine, origin }: InstallCommandProps): ReactNode {
  const remembered = useRememberedEngine();
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense
      fallback={
        <InstallCommandTabs
          name={name}
          engine={engine ?? remembered}
          origin={origin}
          style={DEFAULT_PLATFORM_STYLE.native}
        />
      }
    >
      <InstallCommandFromUrl name={name} engine={engine ?? remembered} origin={origin} />
    </Suspense>
  );
}

function InstallCommandFromUrl(props: Required<InstallCommandProps>): ReactNode {
  return <InstallCommandTabs {...props} style={useCurrentStyle('native')} />;
}

interface InstallCommandTabsProps extends Required<InstallCommandProps> {
  style: PlatformStyle<'native'>;
}

function InstallCommandTabs({ name, engine, origin, style }: InstallCommandTabsProps): ReactNode {
  const url = new URL(`r/styles/${registryStyle({ platform: 'native', engine, style })}/${name}.json`, origin);

  return (
    <Tabs data-slot="install-command" defaultValue="registry" className="mt-6">
      <TabsList variant="line">
        <TabsTrigger value="registry">@zui</TabsTrigger>
        <TabsTrigger value="url">URL</TabsTrigger>
      </TabsList>
      <TabsContent value="registry">
        <DocsCodeBlock code={`pnpm dlx shadcn@latest add @zui/${name}`} language="bash" className="mt-6" />
      </TabsContent>
      <TabsContent value="url">
        <DocsCodeBlock code={`pnpm dlx shadcn@latest add ${url.href}`} language="bash" className="mt-6" />
      </TabsContent>
    </Tabs>
  );
}

export { InstallCommand };
