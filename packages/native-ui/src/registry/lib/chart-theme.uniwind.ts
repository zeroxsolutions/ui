import { Platform } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { useColorScheme } from './color-scheme';

/** The scheme the app draws, and each theme colour a chart can name, such as `var(--chart-1)`. */
interface ChartTheme {
  colorScheme: 'light' | 'dark';
  /**
   * The colour a part draws for the theme variable `name`, such as `--chart-1`: a colour React Native
   * reads on a device, and a CSS colour the browser resolves on the web. `undefined` for a variable the
   * theme does not hold, or on a device for one outside {@link THEME_COLORS}; in development that is reported
   * once per name through `console.warn`.
   */
  themeColor: (name: string) => string | undefined;
}

/** The theme item's colours, each a chart can name on a device. */
const THEME_COLORS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
] as const;

const reported = new Set<string>();

/** Reports once, in development, a theme variable a device cannot draw, which would draw black or nothing. */
function reportMissing(name: string): undefined {
  if (__DEV__ && !reported.has(name)) {
    reported.add(name);
    console.warn(`Chart: no theme colour ${name} on this device; the part naming it draws no colour.`);
  }
  return undefined;
}

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
  const colorScheme = useColorScheme();
  const device = usePlatformColors();
  return {
    colorScheme,
    themeColor: (name) => {
      const variable = colorVariable(name);
      if (device === undefined) return `var(${variable})`;
      return device.get(variable) ?? reportMissing(name);
    },
  };
}

export { useChartTheme };
export type { ChartTheme };
