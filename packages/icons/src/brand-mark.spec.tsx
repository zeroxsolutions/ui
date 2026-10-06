import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BrandMark,
  BrandMarkStyleProvider,
  DEFAULT_BRAND_MARK_BASE,
  setBrandMarkBase,
  setBrandMarkStyle,
} from './brand-mark';

afterEach(() => {
  cleanup();
  setBrandMarkBase(undefined);
  // The provider writes the module default, as FluentEmojiStyleProvider does.
  setBrandMarkStyle(undefined);
  vi.restoreAllMocks();
});

const B = DEFAULT_BRAND_MARK_BASE;
const mark = (name = 'Mark') => screen.getByRole('img', { name });
const failProbe = () => fireEvent.error(screen.getByTestId('brand-mark-probe'));

describe('BrandMark', () => {
  it('draws color as an image of the colour file', () => {
    render(<BrandMark name="facebook" label="Mark" />);
    expect(mark().tagName).toBe('IMG');
    expect(mark().getAttribute('src')).toBe(`${B}/color/facebook.svg`);
    expect(mark().dataset.variant).toBe('color');
  });

  it('draws mono as a currentColor mask of the mono file', () => {
    render(<BrandMark name="openai" variant="mono" label="Mark" />);
    expect(mark().tagName).toBe('SPAN');
    expect(mark().style.maskImage).toBe(`url("${B}/mono/openai.svg")`);
    expect(mark().style.backgroundColor).toBe('currentColor');
  });

  it('draws combine as a mask of the combine file', () => {
    render(<BrandMark name="openai" variant="combine" label="Mark" />);
    expect(mark().style.maskImage).toBe(`url("${B}/combine/openai.svg")`);
  });

  it('draws avatar as an image, round by default and a rounded square on request', () => {
    render(<BrandMark name="claude" variant="avatar" label="Mark" />);
    expect(mark().getAttribute('src')).toBe(`${B}/avatar/claude.svg`);
    expect(mark().style.borderRadius).toBe('50%');
    cleanup();
    render(<BrandMark name="claude" variant="avatar" shape="square" label="Mark" />);
    expect(mark().style.borderRadius).toBe('25%');
  });

  it('sizes the height and keeps the ratio on the width, for a number and for a CSS length', () => {
    render(<BrandMark name="openai" variant="combine" size={20} label="Mark" />);
    expect(mark().style.height).toBe('20px');
    expect(parseFloat(mark().style.width)).toBeGreaterThan(20);
    cleanup();
    render(<BrandMark name="openai" variant="combine" size="1.25rem" label="Mark" />);
    expect(mark().style.height).toBe('1.25rem');
    expect(mark().style.width).toMatch(/^calc\(1\.25rem \* [\d.]+\)$/);
  });

  it('starts at the first variant the mark has, with no request for one it lacks', () => {
    // openai ships no colour file, so a colour request draws its mono file straight away.
    render(<BrandMark name="openai" label="Mark" />);
    expect(mark().dataset.variant).toBe('mono');
  });

  it('falls to the next variant after a failed load', () => {
    render(<BrandMark name="claude" label="Mark" />);
    fireEvent.error(mark());
    expect(mark().dataset.variant).toBe('mono');
  });

  it('falls from a failed mono file to the first letter of the name', () => {
    render(<BrandMark name="openai" variant="mono" label="Mark" />);
    failProbe();
    expect(mark().textContent).toBe('O');
    expect(mark().dataset.variant).toBe('letter');
  });

  it('starts again from the top of the chain when the name changes after a failure', () => {
    const { rerender } = render(<BrandMark name="openai" variant="mono" label="Mark" />);
    failProbe();
    rerender(<BrandMark name="claude" variant="mono" label="Mark" />);
    expect(mark().dataset.variant).toBe('mono');
  });

  it('treats an image already broken when it mounts as failed', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    render(<BrandMark name="facebook" label="Mark" />);
    expect(mark().dataset.variant).not.toBe('color');
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
  });
});
