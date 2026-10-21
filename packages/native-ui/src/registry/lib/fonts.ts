import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Geist_700Bold } from '@expo-google-fonts/geist/700Bold';
import type { FontSource } from 'expo-font';

/**
 * The Geist faces the theme's `font-sans` classes name, keyed by the family name the theme gives
 * each one. Pass it to `useFonts` and hold the first render until the fonts have loaded.
 */
const zuiFonts: Record<string, FontSource> = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
};

export { zuiFonts };
