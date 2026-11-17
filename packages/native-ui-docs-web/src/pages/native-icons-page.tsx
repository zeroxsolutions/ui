import type { ReactNode } from 'react';

import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import { NativeIconGallery } from '../components/data-display/native-icon-gallery';
import { EngineSwitcher } from '../components/navigation/engine-switcher';
import { nativeIconSets } from '../lib/native-icon-sets';

interface NativeIconsPageProps {
  /** The engine the page is read under, whose preview app draws the icons. */
  engine: NativeEngine;
}

/**
 * Every animated icon the native registry publishes, drawn by one engine's preview app, each played as it is
 * pressed.
 */
function NativeIconsPage({ engine }: NativeIconsPageProps): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Icons</h1>
        <p className="text-muted-foreground">
          Animated icons for React Native, each its own registry item. Press an icon or focus it to play it, and tap it
          for its install line and its usage. An icon plays only when the control holding it asks, and stays still for a
          reader who asked for reduced motion.
        </p>
        <EngineSwitcher className="mt-4" />
      </header>
      <NativeIconGallery engine={engine} sets={nativeIconSets} />
    </div>
  );
}

export { NativeIconsPage };
