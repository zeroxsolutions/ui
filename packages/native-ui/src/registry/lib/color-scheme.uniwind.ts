import { useUniwind } from 'uniwind';

/** The colour scheme the app draws, as Uniwind holds it: `dark`, or `light` for any other theme. */
function useColorScheme(): 'light' | 'dark' {
  const { theme } = useUniwind();
  return theme === 'dark' ? 'dark' : 'light';
}

export { useColorScheme };
