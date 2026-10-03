import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FontPreview } from './font-preview';

afterEach(cleanup);

const PANGRAM = 'The quick brown fox jumps over the lazy dog';

function fontFaceText(): string {
  return document.querySelector('[data-slot=font-preview] style')?.textContent ?? '';
}

describe('FontPreview', () => {
  it('draws one specimen per default size, largest first, in the pangram', () => {
    render(<FontPreview src="/fonts/inter.woff2" />);
    expect(screen.getAllByText(PANGRAM).map((specimen) => specimen.style.fontSize)).toEqual([
      '36px',
      '24px',
      '18px',
      '14px',
    ]);
  });

  it('draws the caller text at the sizes it is given, each labelled with its size', () => {
    render(
      <FontPreview src="/fonts/inter.woff2" sizes={[20, 12]}>
        Sphinx of black quartz
      </FontPreview>,
    );
    expect(screen.getAllByText('Sphinx of black quartz')).toHaveLength(2);
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('loads the file under the family its specimens are set in, with the format read off the extension', () => {
    render(<FontPreview src="/fonts/inter.woff2" />);
    const family = screen.getAllByText(PANGRAM)[0].style.fontFamily;
    expect(fontFaceText()).toContain(`font-family: '${family}'`);
    expect(fontFaceText()).toContain('url("/fonts/inter.woff2") format("woff2")');
  });

  it('keeps a data URL intact', () => {
    const src = 'data:font/woff2;base64,d09GMgABAAAAA+/=';
    render(<FontPreview src={src} format="woff2" />);
    expect(fontFaceText()).toContain(`url("${src}") format("woff2")`);
  });

  it('keeps a src or format that tries to close the rule inside its string, leaving the page styles alone', () => {
    render(
      <>
        <div data-testid="sentinel">Sentinel</div>
        <FontPreview
          src={'/x.woff2"); } [data-testid="sentinel"] { display: none; } @font-face { src: url("'}
          format={'woff2") } * { color: red } x { a: ("'}
        />
      </>,
    );
    const style = document.querySelector('[data-slot=font-preview] style') as HTMLStyleElement;
    expect(style.sheet?.cssRules).toHaveLength(1);
    expect(getComputedStyle(screen.getByTestId('sentinel')).display).toBe('block');
  });
});
