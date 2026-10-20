import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATUS_TOKENS, oklchToSrgb, themeItem, type TokenSet, type UpstreamColors } from './theme';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/colors-neutral.json');
const colors = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as UpstreamColors;
const STATUS_NAMES = ['success', 'success-foreground', 'warning', 'warning-foreground'];
const GEIST_FAMILIES = {
  sans: 'Geist_400Regular',
  'sans-medium': 'Geist_500Medium',
  'sans-semibold': 'Geist_600SemiBold',
  'sans-bold': 'Geist_700Bold',
};

/** The upstream set shadcn itself picks for each engine's Tailwind major. */
const nativewindSet = colors.cssVars;
const uniwindSet = colors.cssVarsV4 ?? {};

function colourTokens(set: Record<string, string> | undefined): string[] {
  return Object.entries(set ?? {})
    .filter(([, value]) => value.startsWith('oklch('))
    .map(([name]) => name);
}

describe('oklchToSrgb', () => {
  it('converts oklch(1 0 0) to #ffffff', () => {
    expect(oklchToSrgb('oklch(1 0 0)')).toEqual({ red: 255, green: 255, blue: 255, alpha: 1 });
  });

  it('converts oklch(0.145 0 0) to #0a0a0a', () => {
    expect(oklchToSrgb('oklch(0.145 0 0)')).toEqual({ red: 10, green: 10, blue: 10, alpha: 1 });
  });

  it("converts Vega's light destructive to culori's #e7000b, clamping the channel outside sRGB", () => {
    expect(oklchToSrgb('oklch(0.577 0.245 27.325)')).toEqual({ red: 231, green: 0, blue: 11, alpha: 1 });
  });

  it("converts the dark sidebar primary to culori's #1447e6", () => {
    expect(oklchToSrgb('oklch(0.488 0.243 264.376)')).toEqual({ red: 20, green: 71, blue: 230, alpha: 1 });
  });

  it('keeps a percentage alpha as a fraction', () => {
    expect(oklchToSrgb('oklch(1 0 0 / 10%)')).toEqual({ red: 255, green: 255, blue: 255, alpha: 0.1 });
  });

  it('throws on a colour that is not oklch', () => {
    expect(() => oklchToSrgb('hsl(0 0% 100%)')).toThrow('Not an oklch colour: hsl(0 0% 100%)');
  });
});

describe('themeItem for nativewind', () => {
  const item = themeItem(colors, STATUS_TOKENS, 'nativewind');
  const base = item.css?.['@layer base'] as Record<string, Record<string, unknown>>;
  const light = base[':root'] as Record<string, string>;
  const dark = base['@media (prefers-color-scheme: dark)'][':root'] as Record<string, string>;
  const tailwindColors = item.tailwind?.config?.theme?.extend?.colors as Record<string, string>;

  it('is the registry:theme item named theme', () => {
    expect({ name: item.name, type: item.type }).toEqual({ name: 'theme', type: 'registry:theme' });
  });

  it('sets every light token of the snapshot and the status tokens on :root', () => {
    const names = [...Object.keys(nativewindSet.light ?? {}), ...STATUS_NAMES];

    expect(names.filter((name) => !(`--${name}` in light))).toEqual([]);
  });

  it('sets every dark token of the snapshot and the status tokens on :root under a dark color scheme', () => {
    const names = [...Object.keys(nativewindSet.dark ?? {}), ...STATUS_NAMES];

    expect(names.filter((name) => !(`--${name}` in dark))).toEqual([]);
  });

  it('writes a colour as the sRGB channels its Tailwind colour reads', () => {
    expect(light['--background']).toBe('255 255 255');
    expect(dark['--background']).toBe('10 10 10');
    expect(tailwindColors['background']).toBe('rgb(var(--background) / <alpha-value>)');
  });

  it('carries a colour with its own alpha in an alpha variable, in both schemes', () => {
    expect([light['--border'], light['--border-alpha']]).toEqual(['229 229 229', '1']);
    expect([dark['--border'], dark['--border-alpha']]).toEqual(['255 255 255', '0.1']);
    expect(tailwindColors['border']).toBe('rgb(var(--border) / calc(var(--border-alpha) * <alpha-value>))');
  });

  it('maps every colour token to a Tailwind colour that takes an opacity modifier', () => {
    const names = [...colourTokens(nativewindSet.light), ...STATUS_NAMES];

    expect(names.filter((name) => !tailwindColors[name]?.includes('<alpha-value>'))).toEqual([]);
  });

  it('keeps a token that is not a colour as written', () => {
    expect(light['--radius']).toBe('0.625rem');
    expect(tailwindColors['radius']).toBeUndefined();
  });

  it('holds no oklch colour, which React Native cannot draw', () => {
    expect(JSON.stringify(item)).not.toContain('oklch(');
  });

  it('declares a font family per Geist weight', () => {
    expect(item.tailwind?.config?.theme?.extend?.fontFamily).toEqual({
      sans: ['Geist_400Regular'],
      'sans-medium': ['Geist_500Medium'],
      'sans-semibold': ['Geist_600SemiBold'],
      'sans-bold': ['Geist_700Bold'],
    });
  });
});

describe('themeItem for uniwind', () => {
  const item = themeItem(colors, STATUS_TOKENS, 'uniwind');
  const [file] = item.files ?? [];
  const content = file?.content ?? '';

  /** The declarations of one `@variant <scheme> { ... }` block of the theme file. */
  function variantBlock(scheme: 'light' | 'dark'): string {
    const start = content.indexOf(`@variant ${scheme} {`);
    return start < 0 ? '' : content.slice(start, content.indexOf('}', start));
  }

  it('ships the theme file and imports it beside the CSS entry', () => {
    expect({ type: file?.type, target: file?.target }).toEqual({ type: 'registry:file', target: '~/zui-theme.css' });
    expect(item.css).toEqual({ '@import "./zui-theme.css"': {} });
  });

  it.each([
    ['light', uniwindSet.light, STATUS_TOKENS.light],
    ['dark', uniwindSet.dark, STATUS_TOKENS.dark],
  ] as const)('declares every %s colour token and the status tokens in its variant', (scheme, set, status) => {
    const block = variantBlock(scheme);
    const expected = { ...Object.fromEntries(colourTokens(set).map((name) => [name, set?.[name]])), ...status };

    expect(Object.entries(expected).filter(([name, value]) => !block.includes(`--color-${name}: ${value};`))).toEqual(
      [],
    );
  });

  it('declares a token that is not a colour once, outside the variants', () => {
    expect(content).toMatch(/:root \{\n\s+--radius: 0\.625rem;/);
    expect(variantBlock('light')).not.toContain('--radius');
  });

  it('declares a font family per Geist weight', () => {
    for (const [name, family] of Object.entries(GEIST_FAMILIES)) {
      expect(content).toContain(`--font-${name}: '${family}';`);
    }
  });

  it('refuses a colour token one scheme lacks, which Uniwind rejects', () => {
    const lopsided: TokenSet = { light: { success: 'oklch(0.627 0.19 149)' }, dark: {} };

    expect(() => themeItem(colors, lopsided, 'uniwind')).toThrow('success has no dark value');
  });
});

describe('STATUS_TOKENS', () => {
  it('names success, warning and their foregrounds in both schemes', () => {
    expect(Object.keys(STATUS_TOKENS.light).sort()).toEqual(STATUS_NAMES);
    expect(Object.keys(STATUS_TOKENS.dark).sort()).toEqual(STATUS_NAMES);
  });
});
