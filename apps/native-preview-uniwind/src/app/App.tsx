import '../../global.css';

import { Preview, type ColorScheme } from '@zeroxsolutions/native-ui/preview';
import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { Uniwind } from 'uniwind';

// Uniwind.setTheme reads `this`, so it is called on Uniwind rather than handed over.
function applyColorScheme(scheme: ColorScheme): void {
  Uniwind.setTheme(scheme);
}

/** The preview, drawn with Uniwind. */
function App(): ReactNode {
  return <Preview bundledStyle={Constants.expoConfig?.extra?.previewStyle} applyColorScheme={applyColorScheme} />;
}

export { App };
