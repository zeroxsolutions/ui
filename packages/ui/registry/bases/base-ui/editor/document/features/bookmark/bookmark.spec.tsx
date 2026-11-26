import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { Viewer } from '../../react/viewer';
import { bookmark } from './bookmark';

const features = [standardKit(), bookmark()];

const docOf = (attrs: Record<string, unknown>): DocJSON => ({ type: 'doc', content: [{ type: 'bookmark', attrs }] });

function viewed(attrs: Record<string, unknown>): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Viewer doc={docOf(attrs)} features={features} />);
  return host;
}

describe('bookmark', () => {
  it('draws a card linking to its page, with its title, description and image, in the Viewer', () => {
    const card = viewed({
      url: 'https://example.com/a',
      title: 'Example',
      description: 'A page',
      image: 'https://example.com/a.png',
    }).querySelector<HTMLAnchorElement>('[data-slot=bookmark]')!;
    expect(card.getAttribute('href')).toBe('https://example.com/a');
    expect(card.querySelector('[data-slot=bookmark-title]')?.textContent).toBe('Example');
    expect(card.querySelector('[data-slot=bookmark-description]')?.textContent).toBe('A page');
    expect(card.querySelector('[data-slot=bookmark-image]')?.getAttribute('src')).toBe('https://example.com/a.png');
  });

  it('titles a card without a title by its address', () => {
    const host = viewed({ url: 'https://example.com' });
    expect(host.querySelector('[data-slot=bookmark-title]')?.textContent).toBe('https://example.com');
    expect(host.querySelector('[data-slot=bookmark-description]')).toBeNull();
  });

  it('links nowhere and loads no image for an address that is not a web one', () => {
    const host = viewed({ url: 'javascript:alert(1)', image: 'javascript:alert(2)' });
    expect(host.querySelector('[data-slot=bookmark]')?.hasAttribute('href')).toBe(false);
    expect(host.querySelector('img')).toBeNull();
  });

  it('draws nothing for a bookmark without an address in the Viewer', () => {
    expect(viewed({}).querySelector('[data-slot=bookmark]')).toBeNull();
  });

  it('round-trips through HTML with its layout, with the Viewer features', () => {
    const registry = createCodecRegistry(features);
    const doc = docOf({ url: 'https://example.com', title: 'Ex', align: 'end' });
    expect(serialize(doc, 'html', registry)).toContain('data-align="end"');
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });
});
