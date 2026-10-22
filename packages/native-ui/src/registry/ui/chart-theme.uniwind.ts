import { Platform } from 'react-native';
import { useCSSVariable, useUniwind } from 'uniwind';

/** The scheme the app draws, and each theme colour a chart can name, such as `var(--chart-1)`. */
interface ChartTheme {
  colorScheme: 'light' | 'dark';
  /**
   * The colour a part draws for the theme variable `name`, such as `--chart-1`: a colour React Native
   * reads on a device, and a CSS colour the browser resolves on the web. `undefined` for a variable the
   * theme does not hold, or on a device for one outside {@link THEME_COLORS}.
   */
  themeColor: (name: string) => string | undefined;
}

/** The theme colours a chart reads on a device: the ones its own parts draw, and the five chart colours. */
const THEME_COLORS = [
  'background',
  'foreground',
  'muted',
  'muted-foreground',
  'border',
  'primary',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
] as const;

/** Uniwind's theme holds `--chart-1` as the colour `--color-chart-1`. */
function colorVariable(name: string): string {
  return `--color-${name.replace(/^--(color-)?/, '')}`;
}

const DEVICE_VARIABLES = THEME_COLORS.map(colorVariable);

function useDeviceColors(): ReadonlyMap<string, string> {
  const values = useCSSVariable(DEVICE_VARIABLES);
  return new Map(
    DEVICE_VARIABLES.flatMap((name, index) => {
      const value = values[index];
      return value === undefined ? [] : [[name, String(value)] as const];
    }),
  );
}

// The browser reads every variable of the stylesheet itself.
const usePlatformColors = Platform.OS === 'web' ? (): undefined => undefined : useDeviceColors;

/** Reads the colour scheme and the theme colours a chart draws with. */
function useChartTheme(): ChartTheme {
  const { theme } = useUniwind();
  const device = usePlatformColors();
  return {
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    themeColor: (name) => (device === undefined ? `var(${colorVariable(name)})` : device.get(colorVariable(name))),
  };
}

export { useChartTheme };
export type { ChartTheme };
