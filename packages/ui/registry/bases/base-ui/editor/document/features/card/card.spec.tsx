import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { Viewer } from '../../react/viewer';
import { card } from './card';
import { cardDefinition } from './card.testing';

const features = [standardKit(), card(cardDefinition)];

const docOf = (attrs: Record<string, unknown>, text = 'Lanterns and tailors'): DocJSON => ({
  type: 'doc',
  content: [{ type: 'card', attrs, content: [{ type: 'text', text }] as NodeJSON[] }],
});

function viewed(doc: DocJSON): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Viewer doc={doc} features={features} />);
  return host;
}

const full = {
  image: 'https://i.test/hoi-an.jpg',
  alt: 'Lanterns over the river',
  heading: 'Hoi An',
  buttonLabel: 'Read more',
  buttonHref: 'https://guide.test/hoi-an',
};

describe('card', () => {
  it('draws its image, title, text and button in the Viewer', () => {
    const host = viewed(docOf(full));
    expect(host.querySelector('[data-slot=card-image]')?.getAttribute('src')).toBe(full.image);
    expect(host.querySelector('[data-slot=card-image]')?.getAttribute('alt')).toBe(full.alt);
    expect(host.querySelector('[data-slot=card-title]')?.textContent).toBe('Hoi An');
    expect(host.querySelector('[data-slot=card-text]')?.textContent).toBe('Lanterns and tailors');
    expect(host.querySelector('[data-slot=card-button]')?.getAttribute('href')).toBe(full.buttonHref);
  });

  it('titles itself below the headings a table of contents lists', () => {
    expect(viewed(docOf(full)).querySelector('h1, h2, h3')).toBeNull();
  });

  it('draws no button without a label or a web address, and no image from another address', () => {
    expect(viewed(docOf({ ...full, buttonLabel: '' })).querySelector('[data-slot=card-button]')).toBeNull();
    const hostile = viewed(docOf({ ...full, buttonHref: 'javascript:alert(1)', image: 'javascript:alert(2)' }));
    expect(hostile.querySelector('[data-slot=card-button]')).toBeNull();
    expect(hostile.querySelector('img')).toBeNull();
  });

  it('round-trips through HTML with the Viewer features', () => {
    const registry = createCodecRegistry(features);
    const doc = docOf(full);
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });
});
