import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  BrandMark,
  BrandMarkStyleProvider,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
  type BrandMarkName,
} from './brand-mark';

afterEach(() => {
  cleanup();
  setBrandMarkBase(undefined);
  // The provider writes the module default, as FluentEmojiStyleProvider does.
  setBrandMarkStyle(undefined);
});

const B = DEFAULT_BRAND_MARK_BASE;
const mark = (name = 'Mark') => screen.getByRole('img', { name });

describe('BrandMark', () => {
  it('draws color as an image of the colour file', () => {
    render(<BrandMark name="facebook" label="Mark" />);
    expect(mark().tagName).toBe('IMG');
    expect(mark().getAttribute('src')).toBe(`${B}/color/facebook.svg`);
    expect(mark().dataset.variant).toBe('color');
  });

  it('starts at the first variant the mark has, with no request for one it lacks', () => {
    // openai ships no colour file, so a colour request draws its mono file straight away.
    render(<BrandMark name="openai" label="Mark" />);
    expect(mark().dataset.variant).toBe('mono');
  });

  it('asks for the colour file when a mark has no combine file, and never for combine', () => {
    const { container } = render(<BrandMark name="facebook" variant="combine" label="Mark" />);
    expect(mark().getAttribute('src')).toBe(`${B}/color/facebook.svg`);
    const all = Array.from(container.querySelectorAll<HTMLElement>('*'));
    expect(all.some((el) => (el.getAttribute('src') ?? '').includes('/combine/'))).toBe(false);
    expect(all.some((el) => el.style.maskImage.includes('/combine/'))).toBe(false);
  });

  it('draws the first letter for a name the manifest does not list', () => {
    // Runtime data cast to BrandMarkName can name a brand with no files at all.
    render(<BrandMark name={'no-such-brand' as BrandMarkName} label="Mark" />);
    expect(mark().textContent).toBe('N');
    expect(mark().dataset.variant).toBe('letter');
  });

  it('is named by label, and left out of the accessibility tree without it', () => {
    render(<BrandMark name="google" label="Google" />);
    expect(mark('Google')).toBeTruthy();
    cleanup();
    render(<BrandMark name="google" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('takes the ambient style from the provider, and a call of its own over it', () => {
    render(
      <BrandMarkStyleProvider defaultStyle="mono">
        <BrandMark name="claude" label="Ambient" />
        <BrandMark name="claude" variant="color" label="Own" />
      </BrandMarkStyleProvider>,
    );
    expect(mark('Ambient').dataset.variant).toBe('mono');
    expect(mark('Own').dataset.variant).toBe('color');
  });

  it('serves from the module base, and from a per-call base over it', () => {
    setBrandMarkBase('/marks');
    render(<BrandMark name="facebook" base="/other" label="Mark" />);
    expect(mark().getAttribute('src')).toBe('/other/color/facebook.svg');
    cleanup();
    render(<BrandMark name="facebook" label="Module" />);
    expect(mark('Module').getAttribute('src')).toBe('/marks/color/facebook.svg');
  });
});
