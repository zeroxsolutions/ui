import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { fromEmailBlocks, toEmailBlocks } from '@zeroxsolutions/editor-core/profiles/index';
import { Viewer } from '../../react/viewer';
import { callout } from '../callout/index';
import { columns } from '../columns/index';
import { standardKit } from '../standard/index';
import { table } from '../table/index';
import { section } from './section';

const features = [section(), columns(), callout(), table(), standardKit()];
const registry = createCodecRegistry(features);

const line = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const sectionOf = (attrs: Record<string, unknown>, ...content: NodeJSON[]): NodeJSON => ({
  type: 'section',
  attrs,
  content,
});
const docOf = (...content: NodeJSON[]): DocJSON => ({ type: 'doc', content });
const twoLanes: NodeJSON = {
  type: 'columns',
  attrs: { ratio: [1, 1] },
  content: [
    { type: 'column', content: [line('left')] },
    { type: 'column', content: [line('right')] },
  ],
};

/** Whether a section of `nodes` sits below the top of the document. */
function sectionBelowTop(nodes: readonly NodeJSON[], inside = false): boolean {
  return nodes.some((node) => (node.type === 'section' && inside) || sectionBelowTop(node.content ?? [], true));
}

describe('section', () => {
  it('round-trips through HTML with its background, padding, width and space', () => {
    const doc = docOf(
      sectionOf(
        { background: 'teal', padding: 'large', width: 'wide', spaceBefore: 'none', spaceAfter: 'small' },
        line('inside'),
        line('more'),
      ),
    );
    const html = serialize(doc, 'html', registry);
    expect(html).toBe(
      '<section data-section data-background="teal" data-padding="large" data-width="wide"' +
        ' data-space-before="none" data-space-after="small"><p>inside</p><p>more</p></section>',
    );
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('round-trips a section holding columns through HTML', () => {
    const doc = docOf(sectionOf({ background: 'muted' }, line('above'), twoLanes));
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
  });

  it('writes and reads no value outside its tokens', () => {
    const doc = docOf(sectionOf({ background: '#ff0000', padding: '12px', width: 'huge' }, line('in')));
    expect(serialize(doc, 'html', registry)).toBe('<section data-section><p>in</p></section>');
    const pasted = '<section data-section data-background="red;color:blue" data-padding="2px"><p>in</p></section>';
    expect(importHTML(pasted, registry).doc).toEqual(docOf(sectionOf({}, line('in'))));
  });

  it('reads a section inside a section from HTML as the blocks it holds', () => {
    const html =
      '<section data-section data-background="muted"><p>a</p>' +
      '<section data-section data-background="red"><p>b</p></section></section>';
    expect(importHTML(html, registry).doc).toEqual(docOf(sectionOf({ background: 'muted' }, line('a'), line('b'))));
  });

  it.each([
    [
      'a lane',
      (inner: string) => `<div data-columns><div data-column>${inner}</div><div data-column><p>r</p></div></div>`,
    ],
    ['a callout', (inner: string) => `<div data-callout="info">${inner}</div>`],
    ['a list item', (inner: string) => `<ul><li>${inner}</li></ul>`],
    ['a table cell', (inner: string) => `<table><tbody><tr><td>${inner}</td></tr></tbody></table>`],
  ])('reads a section in %s from HTML as the blocks it holds', (_, holder) => {
    const doc = importHTML(holder('<section data-section data-background="red"><p>deep</p></section>'), registry).doc;
    expect(sectionBelowTop(doc.content ?? [])).toBe(false);
    expect(JSON.stringify(doc)).toContain('"deep"');
  });

  it('draws a section below the top in the Viewer as the blocks it holds', () => {
    const nested = docOf({
      type: 'callout',
      attrs: { variant: 'info' },
      content: [sectionOf({ background: 'red' }, line('deep'))],
    });
    const markup = renderToStaticMarkup(<Viewer doc={nested} features={features} />);
    expect(markup).not.toContain('data-slot="section"');
    expect(markup).toContain('<p>deep</p>');
  });

  it('reads a plain section element of a pasted page as its blocks', () => {
    expect(importHTML('<section><p>a</p></section>', registry).doc).toEqual(docOf(line('a')));
  });

  it("writes Markdown as the section's blocks in order", () => {
    const doc = docOf(sectionOf({ background: 'blue' }, line('one'), line('two')), line('after'));
    expect(serialize(doc, 'markdown', registry).trim()).toBe('one\n\ntwo\n\nafter');
  });

  it('draws in the Viewer with the attributes its view draws', () => {
    const markup = renderToStaticMarkup(
      <Viewer
        doc={docOf(sectionOf({ background: 'violet', padding: 'small', width: 'full' }, line('in')))}
        features={features}
      />,
    );
    expect(markup).toMatch(
      /<section data-slot="section" data-background="violet" data-padding="small" data-width="full"[^>]*>/,
    );
    expect(markup).toContain('<p>in</p>');
  });

  it('carries a section holding columns through the email wire', () => {
    const doc = docOf(sectionOf({ background: 'amber', padding: 'small', width: 'full' }, twoLanes));
    const [wire] = toEmailBlocks(doc);
    expect(wire).toMatchObject({
      type: 'section',
      attributes: { background: 'amber', padding: 'small', width: 'wide' },
      lanes: [[{ type: 'columns' }]],
    });
    expect(fromEmailBlocks(toEmailBlocks(doc)).content?.[0]).toMatchObject({
      type: 'section',
      attrs: { background: 'amber', padding: 'small', width: 'wide' },
      content: [{ type: 'columns' }],
    });
  });
});
