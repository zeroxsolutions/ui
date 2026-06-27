import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { emojiToUnicode } from './codepoint';
import {
  fluentEmojiUrl,
  setFluentEmojiBase,
  setFluentEmojiStyle,
  setFluentEmojiStyleBase,
} from './resolve';
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
  it('builds a <base>/3d/<code>.webp URL by default', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji' })).toBe(
      'https://cdn.example/emoji/3d/1f92f.webp',
    );
  });

  it('builds a <base>/flat/<code>.svg URL for the flat style', () => {
    expect(
      fluentEmojiUrl('🤯', { base: 'https://cdn.example/emoji', style: 'flat' }),
    ).toBe('https://cdn.example/emoji/flat/1f92f.svg');
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
    expect(fluentEmojiUrl('🤯', { style: '3d' })).toBe(
      'https://cdn.example/emoji/3d/1f92f.webp',
    );
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
    expect(fluentEmojiUrl('🤯', { style: 'anim' })).toBe(
      'https://anim-cdn.example/anim/1f92f.webp',
    );
    // …while the static styles keep resolving from the global base.
    expect(fluentEmojiUrl('🤯', { style: 'flat' })).toBe(
      'https://cdn.example/emoji/flat/1f92f.svg',
    );
  });

  it('lets a per-call base win over the per-style base', () => {
    setFluentEmojiStyleBase('anim', 'https://anim-cdn.example');
    expect(fluentEmojiUrl('🤯', { style: 'anim', base: 'https://per-call' })).toBe(
      'https://per-call/anim/1f92f.webp',
    );
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
    expect(fluentEmojiUrl('🤯', { style: 'anim' })).toBe(
      'https://cdn.example/emoji/anim/1f92f.webp',
    );
  });
});

describe('<FluentEmoji>', () => {
  it('renders an <img> with the resolved src and accessible name', () => {
    render(
      <FluentEmoji
        glyph="🤯"
        name="exploding head"
        base="https://cdn.example/emoji"
      />,
    );
    const img = screen.getByRole('img', { name: 'exploding head' });
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe(
      'https://cdn.example/emoji/3d/1f92f.webp',
    );
  });

  it('resolves the flat svg when variant="flat"', () => {
    render(
      <FluentEmoji
        glyph="🤯"
        name="exploding head"
        variant="flat"
        base="https://cdn.example/emoji"
      />,
    );
    expect(
      screen.getByRole('img', { name: 'exploding head' }).getAttribute('src'),
    ).toBe('https://cdn.example/emoji/flat/1f92f.svg');
  });

  it('resolves the animated webp when variant="anim"', () => {
    render(
      <FluentEmoji
        glyph="🤯"
        name="exploding head"
        variant="anim"
        base="https://cdn.example/emoji"
      />,
    );
    expect(
      screen.getByRole('img', { name: 'exploding head' }).getAttribute('src'),
    ).toBe('https://cdn.example/emoji/anim/1f92f.webp');
  });

  it('falls back to the native glyph when the image fails to load', () => {
    render(<FluentEmoji glyph="🤯" base="https://cdn.example/emoji" />);
    fireEvent.error(screen.getByRole('img'));
    const fallback = screen.getByRole('img');
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.textContent).toBe('🤯');
  });
});
