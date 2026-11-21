// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FIXTURE_THEME } from './fixtures.fixture.js';
import { assertEmailTheme, EmailThemeInvalid, fontStack } from './theme.js';

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
