import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { callout } from '../callout/index';
import { standardKit } from '../standard/index';
import { toggleHeading } from '../toggle-heading/index';
import { Viewer } from '../../react/viewer';
import { tableOfContents } from './table-of-contents';

const features = [standardKit(), callout(), toggleHeading(), tableOfContents()];

const heading = (level: number, text: string): NodeJSON => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const paragraph = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });

function viewed(doc: DocJSON): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = renderToStaticMarkup(<Viewer doc={doc} features={features} />);
  return host;
}

describe('tableOfContents', () => {
  it("lists the document's headings in the Viewer, a toggle heading's and a callout's included", () => {
    const host = viewed({
      type: 'doc',
      content: [
        { type: 'tableOfContents' },
        heading(1, 'Trip'),
        { type: 'toggleHeading', attrs: { open: false }, content: [heading(2, 'Day one'), heading(3, 'Morning')] },
        heading(4, 'Too deep'),
        { type: 'callout', attrs: { variant: 'info' }, content: [heading(2, 'Note')] },
      ],
    });
    const nav = host.querySelector('nav[data-slot=table-of-contents]')!;
    expect(nav.getAttribute('aria-label')).toBe('Table of contents');
    expect([...nav.querySelectorAll('li')].map((item) => [item.dataset.level, item.textContent])).toEqual([
      ['1', 'Trip'],
      ['2', 'Day one'],
      ['3', 'Morning'],
      ['2', 'Note'],
    ]);
    expect(nav.querySelector('a')?.getAttribute('href')).toBe('#trip');
  });

  it("draws the headings in the order the entries' places name them", () => {
    const host = viewed({
      type: 'doc',
      content: [
        { type: 'tableOfContents' },
        heading(2, ''),
        { type: 'toggleHeading', attrs: { open: true }, content: [heading(2, 'Day one'), paragraph('x')] },
        heading(3, 'Night'),
      ],
    });
    const drawn = [...host.querySelectorAll('h1, h2, h3')].map((element) => element.textContent);
    expect(drawn).toEqual(['', 'Day one', 'Night']);
  });

  it('draws nothing in the Viewer for a document without headings', () => {
    expect(viewed({ type: 'doc', content: [{ type: 'tableOfContents' }, paragraph('x')] }).textContent).toBe('x');
  });

  it('escapes a heading holding markup', () => {
    const host = viewed({
      type: 'doc',
      content: [{ type: 'tableOfContents' }, heading(2, '<img src=x onerror=alert(1)>')],
    });
    expect(host.querySelector('nav img')).toBeNull();
    expect(host.querySelector('nav a')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('round-trips through HTML with the Viewer features', () => {
    const registry = createCodecRegistry(features);
    const doc: DocJSON = { type: 'doc', content: [{ type: 'tableOfContents', attrs: {} }, heading(2, 'A')] };
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });
});
