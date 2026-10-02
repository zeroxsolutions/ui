import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { emojiToUnicode } from './emoji-to-unicode';
import { fluentEmojiUrl, setFluentEmojiBase, setFluentEmojiStyle, setFluentEmojiStyleBase } from './fluent-emoji-url';
import { FluentEmoji } from './fluent-emoji';

afterEach(() => {
  cleanup();
  setFluentEmojiBase(undefined);
  setFluentEmojiStyle(undefined);
  for (const s of ['3d', 'flat', 'modern', 'mono', 'anim'] as const) {
    setFluentEmojiStyleBase(s, undefined);
  }
});

describe('emojiToUnicode', () => {
  it('maps a single-codepoint emoji to lowercase hex', () => {
    expect(emojiToUnicode('🤯')).toBe('1f92f');
  });

  it('joins a multi-codepoint sequence (flag) with hyphens', () => {
    expect(emojiToUnicode('🇻🇳')).toBe('1f1fb-1f1f3');
  });

  it('keeps the FE0F variation selector in the key', () => {
    expect(emojiToUnicode('❤️')).toBe('2764-fe0f');
  });

  it('returns empty string for empty input', () => {
    expect(emojiToUnicode('')).toBe('');
  });
});

describe('fluentEmojiUrl', () => {
  it("resolves against the package's own assets directory when no base is set", () => {
    // Through a variable, so Vite leaves this `new URL` alone; it rewrites the literal form.
    const specUrl = import.meta.url;
    expect(fluentEmojiUrl('🤯')).toBe(new URL('./assets/3d/1f92f.webp', specUrl).href);
  });

  it('builds a <base>/3d/<code>.webp URL by default', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji' })).toBe('https://cdn.example/emoji/3d/1f92f.webp');
  });

  it('builds a <base>/flat/<code>.svg URL for the flat style', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji', style: 'flat' })).toBe(
      'https://cdn.example/emoji/flat/1f92f.svg',
    );
  });

  it.each([
    ['3d', '3d/1f92f.webp'],
    ['flat', 'flat/1f92f.svg'],
    ['modern', 'modern/1f92f.svg'],
    ['mono', 'mono/1f92f.svg'],
    ['anim', 'anim/1f92f.webp'],
  ] as const)('maps the %s style to the right dir + extension', (style, tail) => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji', style })).toBe(
      `https://cdn.example/emoji/${tail}`,
    );
  });

  it('normalizes a trailing slash on the base', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji/' })).toBe(
      'https://cdn.example/emoji/3d/1f92f.webp',
    );
  });

  it('honors a base set via setFluentEmojiBase', () => {
    setFluentEmojiBase('https://cdn.example/emoji');
    expect(fluentEmojiUrl('🤯')).toBe('https://cdn.example/emoji/3d/1f92f.webp');
  });

  it('honors a default style set via setFluentEmojiStyle', () => {
    setFluentEmojiBase('https://cdn.example/emoji');
    setFluentEmojiStyle('flat');
    expect(fluentEmojiUrl('🤯')).toBe('https://cdn.example/emoji/flat/1f92f.svg');
  });

  it('lets a per-call style win over the configured default', () => {
    setFluentEmojiBase('https://cdn.example/emoji');
    setFluentEmojiStyle('flat');
    expect(fluentEmojiUrl('🤯', { style: '3d' })).toBe('https://cdn.example/emoji/3d/1f92f.webp');
  });

  it('returns undefined for an empty glyph', () => {
    expect(fluentEmojiUrl('')).toBeUndefined();
  });
});

describe('setFluentEmojiStyleBase (per-style base)', () => {
  it('routes one style to its own base while others use the global base', () => {
    setFluentEmojiBase('https://cdn.example/emoji');
    setFluentEmojiStyleBase('anim', 'https://anim-cdn.example');
    // anim uses its dedicated base…
    expect(fluentEmojiUrl('🤯', { style: 'anim' })).toBe('https://anim-cdn.example/anim/1f92f.webp');
    // …while the static styles keep resolving from the global base.
    expect(fluentEmojiUrl('🤯', { style: 'flat' })).toBe('https://cdn.example/emoji/flat/1f92f.svg');
  });

  it('lets a per-call base win over the per-style base', () => {
    setFluentEmojiStyleBase('anim', 'https://anim-cdn.example');
    expect(fluentEmojiUrl('🤯', { style: 'anim', base: 'https://per-call' })).toBe('https://per-call/anim/1f92f.webp');
  });

  it('applies the per-style base for the configured default style too', () => {
    setFluentEmojiStyle('anim');
    setFluentEmojiStyleBase('anim', 'https://anim-cdn.example');
    // No per-call style/base, yet anim still resolves from its dedicated base.
    expect(fluentEmojiUrl('🤯')).toBe('https://anim-cdn.example/anim/1f92f.webp');
  });

  it('clears the override when passed undefined', () => {
    setFluentEmojiBase('https://cdn.example/emoji');
    setFluentEmojiStyleBase('anim', 'https://anim-cdn.example');
    setFluentEmojiStyleBase('anim', undefined);
    expect(fluentEmojiUrl('🤯', { style: 'anim' })).toBe('https://cdn.example/emoji/anim/1f92f.webp');
  });
});

describe('fluentEmojiUrl (manifest coverage)', () => {
  // '🧑‍🩰' (ballet dancer) has no committed file in any assets/<style>/ folder.
  it('resolves to undefined for a glyph with no committed artwork in the style', () => {
    expect(fluentEmojiUrl('🧑‍🩰', { base: 'https://cdn.example/emoji' })).toBeUndefined();
  });

  // '🙂‍↔️' (head shaking horizontally) has a 3d file; it is one of the 24 keys (of 1876) with no anim one.
  it('resolves for a style the glyph has artwork in and not for one it lacks', () => {
    expect(fluentEmojiUrl('🙂‍↔️', { base: 'https://cdn.example/emoji', style: '3d' })).toBe(
      'https://cdn.example/emoji/3d/1f642-200d-2194-fe0f.webp',
    );
    expect(fluentEmojiUrl('🙂‍↔️', { base: 'https://cdn.example/emoji', style: 'anim' })).toBeUndefined();
  });

  it('resolves the phoenix glyph in 3d, flat, modern and mono', () => {
    const phoenix = '🐦‍🔥';
    expect(fluentEmojiUrl(phoenix, { base: 'https://cdn.example/emoji', style: '3d' })).toBe(
      'https://cdn.example/emoji/3d/1f426-200d-1f525.webp',
    );
    expect(fluentEmojiUrl(phoenix, { base: 'https://cdn.example/emoji', style: 'flat' })).toBe(
      'https://cdn.example/emoji/flat/1f426-200d-1f525.svg',
    );
    expect(fluentEmojiUrl(phoenix, { base: 'https://cdn.example/emoji', style: 'modern' })).toBe(
      'https://cdn.example/emoji/modern/1f426-200d-1f525.svg',
    );
    expect(fluentEmojiUrl(phoenix, { base: 'https://cdn.example/emoji', style: 'mono' })).toBe(
      'https://cdn.example/emoji/mono/1f426-200d-1f525.svg',
    );
  });

  it('does not resolve the phoenix glyph in anim (no upstream animated artwork)', () => {
    expect(fluentEmojiUrl('🐦‍🔥', { base: 'https://cdn.example/emoji', style: 'anim' })).toBeUndefined();
  });

  it('ignores a per-call base for a glyph the manifest has no artwork for', () => {
    // The manifest describes this package's OWN artwork, so a custom `base` (a different host for
    // the same files) still resolves to undefined rather than pointing a request at it.
    expect(fluentEmojiUrl('🧑‍🩰', { base: 'https://anything.example' })).toBeUndefined();
  });
});

describe('<FluentEmoji>', () => {
  it('renders an <img> with the resolved src and accessible name', () => {
    render(<FluentEmoji glyph="🤯" name="exploding head" base="https://cdn.example/emoji" />);
    const img = screen.getByRole('img', { name: 'exploding head' });
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('https://cdn.example/emoji/3d/1f92f.webp');
  });

  it('renders only the native glyph, with no <img>, for a glyph with no committed artwork', () => {
    render(<FluentEmoji glyph="🧑‍🩰" name="ballet dancer" base="https://cdn.example/emoji" />);
    expect(document.querySelector('img')).toBeNull();
    const fallback = screen.getByRole('img', { name: 'ballet dancer' });
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.textContent).toBe('🧑‍🩰');
  });

  it('resolves the flat svg when variant="flat"', () => {
    render(<FluentEmoji glyph="🤯" name="exploding head" variant="flat" base="https://cdn.example/emoji" />);
    expect(screen.getByRole('img', { name: 'exploding head' }).getAttribute('src')).toBe(
      'https://cdn.example/emoji/flat/1f92f.svg',
    );
  });

  it('resolves the animated webp when variant="anim"', () => {
    render(<FluentEmoji glyph="🤯" name="exploding head" variant="anim" base="https://cdn.example/emoji" />);
    expect(screen.getByRole('img', { name: 'exploding head' }).getAttribute('src')).toBe(
      'https://cdn.example/emoji/anim/1f92f.webp',
    );
  });

  it('falls back to the native glyph when the image fails to load', () => {
    render(<FluentEmoji glyph="🤯" base="https://cdn.example/emoji" />);
    fireEvent.error(screen.getByRole('img'));
    const fallback = screen.getByRole('img');
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.textContent).toBe('🤯');
  });
});
