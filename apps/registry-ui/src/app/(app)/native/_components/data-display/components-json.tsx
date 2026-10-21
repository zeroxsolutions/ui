'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeBlock } from '@/components/data-display/docs-code-block';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { registryStyle } from '@/lib/style-choice';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

interface ComponentsJsonProps {
  /** The engine whose `components.json` it is: NativeWind names its Tailwind 3 config, Uniwind's Tailwind 4 has none. */
  engine: NativeEngine;
  /** The origin the registry is served from, which the MDX components bind. */
  origin: string;
}

/** A native app's `components.json` for `engine`, its `style` in the style the page shows. */
function ComponentsJson(props: ComponentsJsonProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense fallback={<ComponentsJsonBlock {...props} style={DEFAULT_PLATFORM_STYLE.native} />}>
      <ComponentsJsonFromUrl {...props} />
    </Suspense>
  );
}

function ComponentsJsonFromUrl(props: ComponentsJsonProps): ReactNode {
  return <ComponentsJsonBlock {...props} style={useCurrentStyle('native')} />;
}

function ComponentsJsonBlock({
  engine,
  origin,
  style,
}: ComponentsJsonProps & { style: PlatformStyle<'native'> }): ReactNode {
  const json = {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: registryStyle({ platform: 'native', engine, style }),
    rsc: false,
    tsx: true,
    tailwind: {
      config: engine === 'nativewind' ? 'tailwind.config.js' : '',
      css: 'global.css',
      baseColor: 'neutral',
      cssVariables: true,
    },
    aliases: {
      components: '@/components',
      ui: '@/components/ui',
      lib: '@/lib',
      utils: '@/lib/utils',
      hooks: '@/hooks',
    },
    registries: { '@zui': `${origin}/r/styles/{style}/{name}.json` },
  };

  return (
    <DocsCodeBlock code={JSON.stringify(json, null, 2)} language="json" title="components.json" className="mt-6" />
  );
}

export { ComponentsJson };
