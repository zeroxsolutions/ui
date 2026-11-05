'use client';

import { Suspense, type ReactNode } from 'react';

import { DocsCodeCard } from '@zeroxsolutions/ui/site/components/data-display/docs-code-card';
import { DEFAULT_PLATFORM_STYLE } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { useCurrentStyle } from '@zeroxsolutions/ui/site/hooks/use-current-style';
import { nativeComponentsJson } from '../../lib/native-install';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import type { PlatformStyle } from '@zeroxsolutions/ui/site/types/platform';

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
  return (
    <DocsCodeCard
      code={nativeComponentsJson({ engine, style, origin })}
      language="json"
      title="components.json"
      className="mt-6"
    />
  );
}

export { ComponentsJson };
