import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { emojiToUnicode } from './codepoint';
import { fluentEmojiUrl, setFluentEmojiBase } from './resolve';
import { FluentEmoji } from './fluent-emoji';

afterEach(() => {
  cleanup();
  setFluentEmojiBase(undefined);
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
  it('builds a <base>/<code>.webp URL when a base option is given', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/3d' })).toBe(
      'https://cdn.example/3d/1f92f.webp',
    );
  });

  it('normalizes a trailing slash on the base', () => {
    expect(fluentEmojiUrl('🤯', { base: 'https://cdn.example/3d/' })).toBe(
      'https://cdn.example/3d/1f92f.webp',
    );
  });

  it('honors a base set via setFluentEmojiBase', () => {
    setFluentEmojiBase('https://cdn.example/3d');
    expect(fluentEmojiUrl('🤯')).toBe('https://cdn.example/3d/1f92f.webp');
  });

  it('returns undefined for an empty glyph', () => {
    expect(fluentEmojiUrl('')).toBeUndefined();
  });
});

describe('<FluentEmoji>', () => {
  it('renders an <img> with the resolved src and accessible name', () => {
    render(
      <FluentEmoji glyph="🤯" name="exploding head" base="https://cdn.example/3d" />,
    );
    const img = screen.getByRole('img', { name: 'exploding head' });
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('https://cdn.example/3d/1f92f.webp');
  });

  it('falls back to the native glyph when the image fails to load', () => {
    render(<FluentEmoji glyph="🤯" base="https://cdn.example/3d" />);
    fireEvent.error(screen.getByRole('img'));
    const fallback = screen.getByRole('img');
    expect(fallback.tagName).toBe('SPAN');
    expect(fallback.textContent).toBe('🤯');
  });
});
