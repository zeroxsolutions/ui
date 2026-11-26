// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { HUES } from '../layout/index.js';
import { surfaceColorOf, textColorOf } from './css/base-stylesheet.js';
import { FIXTURE_THEME } from './fixtures.fixture.js';
import {
  assertEmailTheme,
  DEFAULT_EMAIL_THEME,
  EmailThemeInvalid,
  fontStack,
  resolveEmailTheme,
  tint,
} from './theme.js';

describe('assertEmailTheme', () => {
  it('accepts six- and eight-digit hex colours', () => {
    expect(() =>
      assertEmailTheme({ ...FIXTURE_THEME, colors: { ...FIXTURE_THEME.colors, border: '#FFFFFF1A' } }),
    ).not.toThrow();
  });

  it.each(['oklch(0.5 0.1 165)', 'var(--primary)', '#FFF', 'red'])(
    'refuses %s, which a mail client cannot read',
    (value) => {
      const theme = { ...FIXTURE_THEME, colors: { ...FIXTURE_THEME.colors, primary: value } };
      expect(() => assertEmailTheme(theme)).toThrow(new EmailThemeInvalid('colors.primary'));
    },
  );

  it('refuses a dark colour a mail client cannot read, named by its path', () => {
    const theme = { ...FIXTURE_THEME, dark: { ...FIXTURE_THEME.colors, muted: 'oklch(0.3 0 0)' } };
    expect(() => assertEmailTheme(theme)).toThrow(new EmailThemeInvalid('dark.muted'));
  });

  it('accepts a dark palette of hex colours', () => {
    expect(() => assertEmailTheme({ ...FIXTURE_THEME, dark: FIXTURE_THEME.colors })).not.toThrow();
  });

  it('refuses a negative or non-finite radius', () => {
    expect(() => assertEmailTheme({ ...FIXTURE_THEME, radius: -1 })).toThrow(EmailThemeInvalid);
    expect(() => assertEmailTheme({ ...FIXTURE_THEME, radius: Number.NaN })).toThrow(EmailThemeInvalid);
  });

  it.each(['Inter";color:red', 'Inter;color:red', 'Inter<'])(
    'refuses a font family %s that would leave its style attribute',
    (family) => {
      expect(() => assertEmailTheme({ ...FIXTURE_THEME, font: { ...FIXTURE_THEME.font, family } })).toThrow(
        new EmailThemeInvalid('font.family'),
      );
    },
  );

  it('writes the family before its fallback', () => {
    expect(fontStack(FIXTURE_THEME)).toBe('Inter, Arial, Helvetica, sans-serif');
  });
});

describe('hues and the accent', () => {
  it.each([
    ['colors.hues.red', { ...FIXTURE_THEME, colors: { ...FIXTURE_THEME.colors, hues: { red: 'red' } } }],
    ['colors.accent', { ...FIXTURE_THEME, colors: { ...FIXTURE_THEME.colors, accent: 'var(--accent)' } }],
    ['dark.hues.blue', { ...FIXTURE_THEME, dark: { ...FIXTURE_THEME.colors, hues: { blue: '#00F' } } }],
  ])('refuses a value that is not hex at %s', (path, theme) => {
    expect(() => assertEmailTheme(theme)).toThrow(new EmailThemeInvalid(path));
  });

  it('fills an absent hue and accent from the default, and keeps the ones given', () => {
    const resolved = resolveEmailTheme({
      ...FIXTURE_THEME,
      colors: { ...FIXTURE_THEME.colors, hues: { red: '#FF0000' } },
    });
    expect(resolved.colors.hues.red).toBe('#FF0000');
    expect(resolved.colors.hues.blue).toBe(DEFAULT_EMAIL_THEME.colors.hues?.blue);
    expect(resolved.colors.accent).toBe(DEFAULT_EMAIL_THEME.colors.accent);
    expect(resolved.dark).toBeUndefined();
  });

  it('fills a dark palette from the default dark one', () => {
    const resolved = resolveEmailTheme({ ...FIXTURE_THEME, dark: FIXTURE_THEME.colors });
    expect(resolved.dark?.hues.teal).toBe(DEFAULT_EMAIL_THEME.dark?.hues?.teal);
  });
});

describe('tint', () => {
  it('mixes a hue into a base by the amount', () => {
    expect(tint('#0D9488', '#FFFFFF', 0.15)).toBe('#DBEFED');
    expect(tint('#000000', '#FFFFFF', 0)).toBe('#FFFFFF');
    expect(tint('#000000', '#FFFFFF', 1)).toBe('#000000');
  });
});

/** A six-digit hex colour's relative luminance, as WCAG 2 defines it. */
function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(one: string, other: string): number {
  const [lighter, darker] = [luminance(one), luminance(other)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('the default hues', () => {
  const palettes = { light: DEFAULT_EMAIL_THEME.colors, dark: DEFAULT_EMAIL_THEME.dark };

  describe.each(Object.entries(palettes))('in %s', (_, colors) => {
    it.each(HUES)('reads %s text at WCAG AA on the background and on its own surface', (hue) => {
      const text = textColorOf(hue, colors);
      expect(contrast(text, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(text, surfaceColorOf(hue, colors))).toBeGreaterThanOrEqual(4.5);
    });
  });
});
