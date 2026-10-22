import { useColorScheme, useUnstableNativeVariable } from 'nativewind';
import { Platform } from 'react-native';

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

type ThemeColorName = (typeof THEME_COLORS)[number];

const THEME_COLOR_NAMES: ReadonlySet<string> = new Set(THEME_COLORS);

/** `R G B` as the theme writes a colour's channels, which NativeWind hands back as numbers or as the text. */
function channelsOf(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && value.trim() !== '') return value.trim().split(/\s+/).join(', ');
  return undefined;
}

// NativeWind compiles a variable into the app only while a class reads it, and no other item reads the
// chart colours, so these do: text-chart-1 text-chart-2 text-chart-3 text-chart-4 text-chart-5
function useThemeChannel(name: ThemeColorName): string | undefined {
  const channels = channelsOf(useUnstableNativeVariable(`--${name}`));
  const alpha: unknown = useUnstableNativeVariable(`--${name}-alpha`);
  if (channels === undefined) return undefined;
  return alpha === undefined ? `rgb(${channels})` : `rgba(${channels}, ${String(alpha)})`;
}

function useDeviceColors(): Readonly<Record<ThemeColorName, string | undefined>> {
  return {
    background: useThemeChannel('background'),
    foreground: useThemeChannel('foreground'),
    muted: useThemeChannel('muted'),
    'muted-foreground': useThemeChannel('muted-foreground'),
    border: useThemeChannel('border'),
    primary: useThemeChannel('primary'),
    'chart-1': useThemeChannel('chart-1'),
    'chart-2': useThemeChannel('chart-2'),
    'chart-3': useThemeChannel('chart-3'),
    'chart-4': useThemeChannel('chart-4'),
    'chart-5': useThemeChannel('chart-5'),
  };
}

// The browser reads every variable of the stylesheet; NativeWind's variable hook draws nothing there.
const usePlatformColors = Platform.OS === 'web' ? (): undefined => undefined : useDeviceColors;

/** Each colour's channels, and its alpha where it has one, as the theme writes them for the browser. */
function webColor(name: string): string {
  return `rgb(var(${name}) / var(${name}-alpha, 1))`;
}

/** Reads the colour scheme and the theme colours a chart draws with. */
function useChartTheme(): ChartTheme {
  const { colorScheme } = useColorScheme();
  const device = usePlatformColors();
  return {
    colorScheme: colorScheme === 'dark' ? 'dark' : 'light',
    themeColor: (name) => {
      if (device === undefined) return webColor(name);
      const token = name.replace(/^--/, '');
      return THEME_COLOR_NAMES.has(token) ? device[token as ThemeColorName] : undefined;
    },
  };
}

export { useChartTheme };
export type { ChartTheme };
