import { useColorScheme as useNativeWindColorScheme } from 'nativewind';

/** The colour scheme the app draws, as NativeWind holds it: `dark`, or `light` for any other. */
function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useNativeWindColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

export { useColorScheme };
