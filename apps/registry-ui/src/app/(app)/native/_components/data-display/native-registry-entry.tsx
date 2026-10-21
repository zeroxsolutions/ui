'use client';

import { Suspense, type ReactNode } from 'react';

import { HomePageCode } from '@/app/(app)/_components/data-display/home-page-code';
import { DEFAULT_PLATFORM_STYLE } from '@/constants/platform-styles';
import { useCurrentStyle } from '@/hooks/use-current-style';
import { registryStyle } from '@/lib/style-choice';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

interface NativeRegistryEntryProps {
  /** The engine whose registry the entry points at. */
  engine: NativeEngine;
  /** The origin the registry is served from. */
  origin: string;
}

/**
 * The two `components.json` keys a native app needs to install from `@zui`: `style`, the engine and the
 * style the page shows, and the `@zui` entry the CLI fills `{style}` into.
 */
function NativeRegistryEntry(props: NativeRegistryEntryProps): ReactNode {
  return (
    // Until the search params are read on the client, a statically rendered page shows the default style.
    <Suspense fallback={<NativeRegistryEntryCode {...props} style={DEFAULT_PLATFORM_STYLE.native} />}>
      <NativeRegistryEntryFromUrl {...props} />
    </Suspense>
  );
}

function NativeRegistryEntryFromUrl(props: NativeRegistryEntryProps): ReactNode {
  return <NativeRegistryEntryCode {...props} style={useCurrentStyle('native')} />;
}

function NativeRegistryEntryCode({
  engine,
  origin,
  style,
}: NativeRegistryEntryProps & { style: PlatformStyle<'native'> }): ReactNode {
  const code = [
    `"style": "${registryStyle({ platform: 'native', engine, style })}",`,
    '"registries": {',
    `  "@zui": "${origin}/r/styles/{style}/{name}.json"`,
    '}',
  ].join('\n');
  return <HomePageCode code={code} language="json" />;
}

export { NativeRegistryEntry };
