import { pinColorScheme, type CssRuleLike } from './color-scheme';

/** A media rule as the browser exposes one, its condition in `media.mediaText`. */
function mediaRule(mediaText: string, cssRules: CssRuleLike[] = []): CssRuleLike & { media: { mediaText: string } } {
  return { cssText: `@media ${mediaText} {}`, media: { mediaText }, cssRules };
}

describe('pinColorScheme', () => {
  it("applies the theme's dark rules whatever the system's scheme, for dark", () => {
    const dark = mediaRule('(prefers-color-scheme: dark)');

    pinColorScheme([{ cssRules: [dark] }], 'dark');

    expect(dark.media.mediaText).toBe('all');
  });

  it("never applies the theme's dark rules, for light", () => {
    const dark = mediaRule('(prefers-color-scheme: dark)');

    pinColorScheme([{ cssRules: [dark] }], 'light');

    expect(dark.media.mediaText).toBe('not all');
  });

  it('leaves a media rule about anything else alone', () => {
    const wide = mediaRule('(min-width: 640px)');

    pinColorScheme([{ cssRules: [wide] }], 'dark');

    expect(wide.media.mediaText).toBe('(min-width: 640px)');
  });

  it('reaches a dark rule nested in a layer', () => {
    const dark = mediaRule('(prefers-color-scheme: dark)');

    pinColorScheme([{ cssRules: [{ cssText: '@layer base {}', cssRules: [dark] }] }], 'dark');

    expect(dark.media.mediaText).toBe('all');
  });

  it('skips a sheet whose rules the browser will not read, such as a cross-origin one', () => {
    const crossOrigin = {
      get cssRules(): never {
        throw new Error('SecurityError');
      },
    };

    expect(() => pinColorScheme([crossOrigin], 'dark')).not.toThrow();
  });
});
