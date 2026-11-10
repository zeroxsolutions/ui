import { render, screen } from '@testing-library/react-native';
import type * as FluentEmojiPackage from '@zeroxsolutions/fluent-emoji';
import { FLUENT_EMOJI_BASE, FluentEmoji, fluentEmojiUrl, type FluentEmojiStyle } from './fluent-emoji';

/**
 * The package's own URL builder. The package works out its default base from `import.meta.url` as it loads,
 * which Expo's Babel preset reads off `globalThis.__ExpoImportMetaRegistry`, and that has no bundle URL under
 * Jest; so the package loads with a stand-in URL, and every comparison passes the base itself.
 */
const packageUrl = ((): typeof FluentEmojiPackage.fluentEmojiUrl => {
  const scope = globalThis as { __ExpoImportMetaRegistry?: unknown };
  const registry = scope.__ExpoImportMetaRegistry;
  scope.__ExpoImportMetaRegistry = { url: 'file:///fluent-emoji/index.js' };
  try {
    return jest.requireActual<typeof FluentEmojiPackage>('@zeroxsolutions/fluent-emoji').fluentEmojiUrl;
  } finally {
    scope.__ExpoImportMetaRegistry = registry;
  }
})();

const STYLES: readonly FluentEmojiStyle[] = ['3d', 'flat', 'modern', 'mono', 'anim'];

/** A plain glyph, one with a variation selector, a ZWJ sequence and a flag. */
const GLYPHS = [
  String.fromCodePoint(0x1f600),
  String.fromCodePoint(0x2764, 0xfe0f),
  String.fromCodePoint(0x1f469, 0x200d, 0x1f4bb),
  String.fromCodePoint(0x1f1fb, 0x1f1f3),
];

describe('fluentEmojiUrl', () => {
  it("builds the package's URL for each glyph in every style, given the same base", () => {
    const cases = GLYPHS.flatMap((glyph) => STYLES.map((style) => [glyph, style] as const));
    const built = cases.map(([glyph, style]) => fluentEmojiUrl(glyph, { style }));
    expect(built).toEqual(cases.map(([glyph, style]) => packageUrl(glyph, { style, base: FLUENT_EMOJI_BASE })));
    expect(built).not.toContain(undefined);
  });

  it('serves the CDN 3d artwork unless told otherwise', () => {
    expect(fluentEmojiUrl('\u{1F600}')).toBe('https://fluent-emoji.zeroxsolutions.com/3d/1f600.webp');
    expect(fluentEmojiUrl('\u{1F600}', { base: 'https://cdn.example.com/emoji/', style: 'flat' })).toBe(
      'https://cdn.example.com/emoji/flat/1f600.svg',
    );
  });

  it('builds nothing for an empty glyph', () => {
    expect(fluentEmojiUrl('')).toBeUndefined();
  });
});

describe('FluentEmoji', () => {
  it('is an image named by its name, or by its glyph when it has none', async () => {
    await render(<FluentEmoji glyph={'\u{1F600}'} name="grinning face" />);
    expect(screen.getByRole('img', { name: 'grinning face' })).toBeOnTheScreen();

    await screen.rerender(<FluentEmoji glyph={'\u{1F600}'} />);
    expect(screen.getByRole('img', { name: '\u{1F600}' })).toBeOnTheScreen();
  });

  it('is hidden from a screen reader when aria-hidden', async () => {
    await render(<FluentEmoji glyph={'\u{1F600}'} name="grinning face" aria-hidden />);
    expect(screen.queryByRole('img', { name: 'grinning face' })).toBeNull();
  });
});
