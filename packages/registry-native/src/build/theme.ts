/**
 * The `theme` item of each engine's registry: Vega's tokens for the neutral base colour, light and
 * dark, plus the status tokens, in the form that engine's stylesheet compiler reads, and Geist's
 * weights as font families.
 */
import type { RegistryItem, registryBaseColorSchema } from 'shadcn/schema';
import type { Engine } from './translate.ts';

/** A token's value per colour scheme, keyed by the token's name without its leading `--`. */
export interface TokenSet {
  light: Readonly<Record<string, string>>;
  dark: Readonly<Record<string, string>>;
}

/** What the theme reads of upstream's base colour file, `styles/upstream/colors-neutral.json`. */
export type UpstreamColors = Pick<ReturnType<(typeof registryBaseColorSchema)['parse']>, 'cssVars' | 'cssVarsV4'>;

/** A colour in sRGB, each channel an integer from 0 to 255 and `alpha` from 0 to 1. */
export interface Srgb {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/**
 * `success` and `warning` take the values the web registry's items add (apps/registry-ui/registry.json).
 * The web registry declares no foreground for either; each foreground is Vega's light `foreground`,
 * the neutral that keeps 4.5:1 contrast on both tones in both schemes, where `primary-foreground` does not.
 */
export const STATUS_TOKENS = {
  light: {
    success: 'oklch(0.627 0.19 149)',
    'success-foreground': 'oklch(0.145 0 0)',
    warning: 'oklch(0.681 0.162 75.834)',
    'warning-foreground': 'oklch(0.145 0 0)',
  },
  dark: {
    success: 'oklch(0.723 0.19 149)',
    'success-foreground': 'oklch(0.145 0 0)',
    warning: 'oklch(0.79 0.155 80)',
    'warning-foreground': 'oklch(0.145 0 0)',
  },
} as const satisfies TokenSet;

/** The upstream set shadcn itself installs for the engine's Tailwind major: 3 for NativeWind, 4 for Uniwind. */
const UPSTREAM_SETS = {
  nativewind: 'cssVars',
  uniwind: 'cssVarsV4',
} as const satisfies Record<Engine, keyof UpstreamColors>;

/**
 * One family per weight, by the name `@expo-google-fonts/geist` loads it under, since React Native
 * picks a custom font's weight by its family name and not by `fontWeight` on Android.
 */
const FONT_FAMILIES = {
  sans: 'Geist_400Regular',
  'sans-medium': 'Geist_500Medium',
  'sans-semibold': 'Geist_600SemiBold',
  'sans-bold': 'Geist_700Bold',
} as const satisfies Record<string, string>;

const UNIWIND_THEME_FILE = 'zui-theme.css';

const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/;

/** Lightness and alpha as a percentage are fractions of 1; chroma as a percentage is of 0.4. */
function oklchNumber(text: string, percentOf: number): number {
  return text.endsWith('%') ? (Number.parseFloat(text) / 100) * percentOf : Number.parseFloat(text);
}

function encodeChannel(linear: number): number {
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}

/**
 * Converts a CSS `oklch(L C H)` or `oklch(L C H / A)` colour to sRGB through OKLab, clamping a
 * channel that falls outside sRGB, as a browser without gamut mapping draws it.
 * @throws {Error} `Not an oklch colour: <value>` for any other notation
 */
export function oklchToSrgb(value: string): Srgb {
  const match = OKLCH.exec(value.trim());
  if (!match) {
    throw new Error(`Not an oklch colour: ${value}`);
  }
  const lightness = oklchNumber(match[1], 1);
  const chroma = oklchNumber(match[2], 0.4);
  const hue = (Number.parseFloat(match[3]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    red: encodeChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    green: encodeChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    blue: encodeChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    alpha: match[4] === undefined ? 1 : oklchNumber(match[4], 1),
  };
}

interface ColourToken {
  name: string;
  light: string;
  dark: string;
}

interface Tokens {
  colours: ColourToken[];
  /** Tokens such as `radius` that hold one value for both schemes. */
  constants: { name: string; value: string }[];
}

/**
 * @throws {Error} `<name> has no <scheme> value` for a colour one scheme lacks, and
 * `<name> differs between schemes` for a token that is not a colour and changes with the scheme
 */
function splitTokens(set: TokenSet): Tokens {
  const tokens: Tokens = { colours: [], constants: [] };
  for (const name of new Set([...Object.keys(set.light), ...Object.keys(set.dark)])) {
    const light = set.light[name];
    const dark = set.dark[name];
    if ((light ?? dark).startsWith('oklch(')) {
      if (light === undefined || dark === undefined) {
        throw new Error(`${name} has no ${light === undefined ? 'light' : 'dark'} value`);
      }
      tokens.colours.push({ name, light, dark });
    } else if (dark !== undefined && light !== undefined && dark !== light) {
      throw new Error(`${name} differs between schemes`);
    } else {
      tokens.constants.push({ name, value: light ?? dark });
    }
  }
  return tokens;
}

/**
 * NativeWind 4 compiles with Tailwind 3, which generates no `bg-x/10` for a colour that is a bare
 * `var()`, so each colour is its channels behind `rgb(... / <alpha-value>)`, the form NativeWind's
 * themes guide uses, and a colour with its own alpha multiplies it into the modifier's.
 */
function nativewindTheme({ colours, constants }: Tokens): Pick<RegistryItem, 'css' | 'tailwind'> {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const colors: Record<string, string> = {};
  for (const { name, value } of constants) light[`--${name}`] = value;
  for (const token of colours) {
    const lightColour = oklchToSrgb(token.light);
    const darkColour = oklchToSrgb(token.dark);
    light[`--${token.name}`] = `${lightColour.red} ${lightColour.green} ${lightColour.blue}`;
    dark[`--${token.name}`] = `${darkColour.red} ${darkColour.green} ${darkColour.blue}`;
    if (lightColour.alpha === 1 && darkColour.alpha === 1) {
      colors[token.name] = `rgb(var(--${token.name}) / <alpha-value>)`;
    } else {
      light[`--${token.name}-alpha`] = String(lightColour.alpha);
      dark[`--${token.name}-alpha`] = String(darkColour.alpha);
      colors[token.name] = `rgb(var(--${token.name}) / calc(var(--${token.name}-alpha) * <alpha-value>))`;
    }
  }
  const fontFamily = Object.fromEntries(Object.entries(FONT_FAMILIES).map(([name, family]) => [name, [family]]));

  return {
    // NativeWind reads `:root` under `prefers-color-scheme: dark` as the dark variables whatever
    // `darkMode` is set to. A `.dark:root` rule would need the `dark` class in a content file, since
    // Tailwind 3 drops a layer's rule whose class no content file names.
    css: { '@layer base': { ':root': light, '@media (prefers-color-scheme: dark)': { ':root': dark } } },
    tailwind: { config: { theme: { extend: { colors, fontFamily } } } },
  };
}

/**
 * Uniwind reads a theme only as `@variant light` and `@variant dark` inside `:root` in `@layer theme`.
 * shadcn writes an item's `cssVars` dark set as a `.dark` rule and adds a `dark` custom variant over
 * Uniwind's own, and its `css` field cannot nest `@variant` in `:root`, so the theme is a file the
 * CSS entry imports.
 */
function uniwindTheme({ colours, constants }: Tokens): Pick<RegistryItem, 'css' | 'files'> {
  const fonts = Object.entries(FONT_FAMILIES).map(([name, family]) => `  --font-${name}: '${family}';`);
  const variant = (scheme: 'light' | 'dark'): string[] => [
    `    @variant ${scheme} {`,
    ...colours.map((token) => `      --color-${token.name}: ${token[scheme]};`),
    '    }',
  ];
  const content = [
    '@theme {',
    ...fonts,
    '}',
    '',
    '@layer theme {',
    '  :root {',
    ...constants.map(({ name, value }) => `    --${name}: ${value};`),
    '',
    ...variant('light'),
    '',
    ...variant('dark'),
    '  }',
    '}',
    '',
  ].join('\n');

  return {
    css: { [`@import "./${UNIWIND_THEME_FILE}"`]: {} },
    files: [
      {
        path: `registry/theme/${UNIWIND_THEME_FILE}`,
        type: 'registry:file',
        target: `~/${UNIWIND_THEME_FILE}`,
        content,
      },
    ],
  };
}

/**
 * Builds the `theme` item for `engine` from upstream's colours for the engine's Tailwind major and
 * `extra`, whose tokens win over upstream's of the same name.
 * @throws {Error} `Upstream colours have no <set>.<scheme>` when the snapshot lacks the set, and the
 * errors of a token one scheme lacks or a constant that changes with the scheme
 */
export function themeItem(colors: UpstreamColors, extra: TokenSet, engine: Engine): RegistryItem {
  const setName = UPSTREAM_SETS[engine];
  const upstream = colors[setName];
  if (!upstream?.light || !upstream.dark) {
    throw new Error(`Upstream colours have no ${setName}.${upstream?.light ? 'dark' : 'light'}`);
  }
  const tokens = splitTokens({
    light: { ...upstream.light, ...extra.light },
    dark: { ...upstream.dark, ...extra.dark },
  });
  const parts = engine === 'nativewind' ? nativewindTheme(tokens) : uniwindTheme(tokens);
  return { name: 'theme', type: 'registry:theme', ...parts };
}
