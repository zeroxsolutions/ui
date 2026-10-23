import { useUnstableNativeVariable } from 'nativewind';
import { Platform } from 'react-native';
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

type ThemeColorName = (typeof THEME_COLORS)[number];

const THEME_COLOR_NAMES: ReadonlySet<string> = new Set(THEME_COLORS);

const reported = new Set<string>();

/** Reports once, in development, a theme variable a device cannot draw, which would draw black or nothing. */
function reportMissing(name: string): undefined {
  if (__DEV__ && !reported.has(name)) {
    reported.add(name);
    console.warn(`Chart: no theme colour ${name} on this device; the part naming it draws no colour.`);
  }
  return undefined;
}

/** `R G B` as the theme writes a colour's channels, which NativeWind hands back as numbers or as the text. */
function channelsOf(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string' && value.trim() !== '') return value.trim().split(/\s+/).join(', ');
  return undefined;
}

// NativeWind compiles a root variable into the app only while some class reads it. The chart colours are
// read by the line of classes in chart.tsx; the others by the items that draw with them.
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
    card: useThemeChannel('card'),
    'card-foreground': useThemeChannel('card-foreground'),
    popover: useThemeChannel('popover'),
    'popover-foreground': useThemeChannel('popover-foreground'),
    primary: useThemeChannel('primary'),
    'primary-foreground': useThemeChannel('primary-foreground'),
    secondary: useThemeChannel('secondary'),
    'secondary-foreground': useThemeChannel('secondary-foreground'),
    muted: useThemeChannel('muted'),
    'muted-foreground': useThemeChannel('muted-foreground'),
    accent: useThemeChannel('accent'),
    'accent-foreground': useThemeChannel('accent-foreground'),
    destructive: useThemeChannel('destructive'),
    border: useThemeChannel('border'),
    input: useThemeChannel('input'),
    ring: useThemeChannel('ring'),
    'chart-1': useThemeChannel('chart-1'),
    'chart-2': useThemeChannel('chart-2'),
    'chart-3': useThemeChannel('chart-3'),
    'chart-4': useThemeChannel('chart-4'),
    'chart-5': useThemeChannel('chart-5'),
    sidebar: useThemeChannel('sidebar'),
    'sidebar-foreground': useThemeChannel('sidebar-foreground'),
    'sidebar-primary': useThemeChannel('sidebar-primary'),
    'sidebar-primary-foreground': useThemeChannel('sidebar-primary-foreground'),
    'sidebar-accent': useThemeChannel('sidebar-accent'),
    'sidebar-accent-foreground': useThemeChannel('sidebar-accent-foreground'),
    'sidebar-border': useThemeChannel('sidebar-border'),
    'sidebar-ring': useThemeChannel('sidebar-ring'),
    success: useThemeChannel('success'),
    'success-foreground': useThemeChannel('success-foreground'),
    warning: useThemeChannel('warning'),
    'warning-foreground': useThemeChannel('warning-foreground'),
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
  const colorScheme = useColorScheme();
  const device = usePlatformColors();
  return {
    colorScheme,
    themeColor: (name) => {
      if (device === undefined) return webColor(name);
      const token = name.replace(/^--/, '');
      const color = THEME_COLOR_NAMES.has(token) ? device[token as ThemeColorName] : undefined;
      return color ?? reportMissing(name);
    },
  };
}

export { useChartTheme };
export type { ChartTheme };
