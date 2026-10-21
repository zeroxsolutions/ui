import '@/global.css';

import { Preview, type ColorScheme } from '@zeroxsolutions/native-ui/preview';
import { colorScheme } from 'nativewind';
import type { ReactNode } from 'react';

import { pinColorScheme } from './color-scheme';

/** NativeWind's web stylesheet puts the dark variables behind the system's scheme, so that is pinned too. */
function applyColorScheme(scheme: ColorScheme): void {
  pinColorScheme(document.styleSheets, scheme);
  colorScheme.set(scheme);
}

/** The preview, drawn with NativeWind. */
function App(): ReactNode {
  return <Preview bundledStyle={process.env.EXPO_PUBLIC_STYLE} applyColorScheme={applyColorScheme} />;
}

export { App };
