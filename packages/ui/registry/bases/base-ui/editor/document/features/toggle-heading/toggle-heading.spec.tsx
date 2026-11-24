import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { toggle } from '../toggle/index';
import { Viewer } from '../../react/viewer';
import { toggleHeading } from './toggle-heading';

// The toggle first, so a toggle heading's element reaches a toggle that must decline it.
const features = [standardKit(), toggle(), toggleHeading()];
const registry = createCodecRegistry(features);

const paragraph = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const heading = (level: number, text: string): NodeJSON => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const docOf = (open: boolean, ...content: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'toggleHeading', attrs: { open }, content }],
});

describe('toggleHeading', () => {
  it('exports a details element with the heading in its summary', () => {
    expect(serialize(docOf(true, heading(2, 'Day one'), paragraph('Walk')), 'html', registry)).toBe(
      '<details data-toggle-heading open><summary><h2>Day one</h2></summary><p>Walk</p></details>',
    );
    expect(serialize(docOf(false, heading(1, 'A')), 'html', registry)).toBe(
      '<details data-toggle-heading><summary><h1>A</h1></summary></details>',
    );
  });

  it.each([true, false])('round-trips through HTML, open %s, past the toggle', (open) => {
    const doc = docOf(open, heading(3, 'Morning'), paragraph('Coffee'), paragraph('Market'));
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });

  it('keeps a plain details element a toggle', () => {
    expect(importHTML('<details open><p>Hi</p></details>', registry).doc.content?.[0]?.type).toBe('toggle');
  });

  it('reads a summary holding no heading as a heading of level 2', () => {
    expect(importHTML('<details data-toggle-heading><summary>Plain</summary><p>x</p></details>', registry).doc).toEqual(
      docOf(false, heading(2, 'Plain'), paragraph('x')),
    );
  });

  it('writes Markdown as raw HTML whose summary holds the heading as escaped text', () => {
    const markdown = serialize(docOf(true, heading(2, '<b>Day</b> & night'), paragraph('Walk')), 'markdown', registry);
    expect(markdown).toContain('<details data-toggle-heading open>');
    expect(markdown).toContain('<summary><h2>&lt;b&gt;Day&lt;/b&gt; &amp; night</h2></summary>');
    expect(markdown).toContain('\nWalk\n');
    expect(markdown).not.toContain('<b>');
  });

  it('draws a details element in the Viewer, its heading in the summary and the rest under it', () => {
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(
      <Viewer doc={docOf(false, heading(2, 'Day one'), paragraph('Walk'))} features={features} />,
    );
    const details = host.querySelector('details[data-slot=toggle-heading]')!;
    expect(details.hasAttribute('open')).toBe(false);
    expect(details.querySelector('summary h2')?.textContent).toBe('Day one');
    expect(details.querySelector(':scope > div > p')?.textContent).toBe('Walk');
  });
});
