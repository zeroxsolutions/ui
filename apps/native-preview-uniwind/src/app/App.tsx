import '../../global.css';

import { Preview, type ColorScheme } from '@zeroxsolutions/native-ui/preview';
import type { ReactNode } from 'react';
import { Uniwind } from 'uniwind';

// Uniwind.setTheme reads `this`, so it is called on Uniwind rather than handed over.
function applyColorScheme(scheme: ColorScheme): void {
  Uniwind.setTheme(scheme);
}

/** The preview, drawn with Uniwind. */
function App(): ReactNode {
  return <Preview bundledStyle={process.env.EXPO_PUBLIC_STYLE} applyColorScheme={applyColorScheme} />;
}

export { App };
