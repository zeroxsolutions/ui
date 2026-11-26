import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { columns } from './columns';

const registry = createCodecRegistry([columns(), standardKit()]);

const line = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const docOf = (attrs: Record<string, unknown>, ...lanes: NodeJSON[][]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'columns', attrs, content: lanes.map((content) => ({ type: 'column', content })) }],
});

describe('columns', () => {
  it('round-trips through HTML, its ratio and each column in order', () => {
    const doc = docOf({ ratio: [2, 1], spaceAfter: 'small' }, [line('left'), line('more')], [line('right')]);
    const html = serialize(doc, 'html', registry);
    expect(html).toBe(
      '<div data-columns data-ratio="2,1" data-space-after="small"><div data-column><p>left</p><p>more</p></div><div data-column><p>right</p></div></div>',
    );
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('round-trips its vertical alignment and the space before it through HTML, and draws both in the Viewer', () => {
    const doc = docOf({ ratio: [8, 4], valign: 'bottom', spaceBefore: 'none' }, [line('left')], [line('right')]);
    const html = serialize(doc, 'html', registry);
    expect(html).toMatch(/^<div data-columns data-ratio="8,4" data-valign="bottom" data-space-before="none">/);
    expect(importHTML(html, registry).doc).toEqual(doc);
    const markup = renderToStaticMarkup(<Viewer doc={doc} features={[columns(), standardKit()]} />);
    expect(markup).toContain('data-valign="bottom"');
    expect(markup).toContain('data-space-before="none"');
  });

  it.each(['none', 'small', 'medium', 'large'])(
    'round-trips a space after of %s and draws it in the Viewer',
    (space) => {
      const doc = docOf({ ratio: [1, 1], spaceAfter: space }, [line('left')], [line('right')]);
      const html = serialize(doc, 'html', registry);
      expect(html).toContain(`data-space-after="${space}"`);
      expect(importHTML(html, registry).doc).toEqual(doc);
      const markup = renderToStaticMarkup(<Viewer doc={doc} features={[columns(), standardKit()]} />);
      expect(markup).toContain(`data-space-after="${space}"`);
    },
  );

  it('reads no vertical alignment outside its set', () => {
    const html =
      '<div data-columns data-valign="middle"><div data-column><p>a</p></div><div data-column><p>b</p></div></div>';
    expect(importHTML(html, registry).doc.content?.[0].attrs).toEqual({});
  });

  it("writes Markdown as each column's blocks in order, a blank line between columns", () => {
    const doc = docOf({ ratio: [1, 1] }, [line('left')], [line('right')]);
    expect(serialize(doc, 'markdown', registry).trim()).toBe('left\n\nright');
  });

  it('drops a ratio it cannot read, and keeps the columns', () => {
    const html = '<div data-columns data-ratio="1,x"><div data-column><p>a</p></div><div data-column></div></div>';
    expect(importHTML(html, registry).doc).toEqual(docOf({}, [line('a')], [{ type: 'paragraph' }]));
  });

  it.each([
    ['styles', ['1fr) ; background:url(https://evil.test/x)', 1]],
    ['markup', ['"><img src=x onerror=alert(1)>', 1]],
    ['text', '1,2'],
    ['weights past the grid', [13, 1]],
  ])('writes and draws no ratio holding %s', (_case, ratio) => {
    const doc = docOf({ ratio }, [line('left')], [line('right')]);
    expect(serialize(doc, 'html', registry)).toMatch(/^<div data-columns><div data-column>/);
    const markup = renderToStaticMarkup(<Viewer doc={doc} features={[columns(), standardKit()]} />);
    expect(markup).not.toContain('--columns-ratio');
  });

  it('reads bare text in a column as a line, and a column outside columns as no column', () => {
    expect(
      importHTML(
        '<div data-columns><div data-column>bare <b>t</b></div><div data-column><p>b</p></div></div>',
        registry,
      ).doc,
    ).toEqual(
      docOf(
        {},
        [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'bare ' },
              { type: 'text', text: 't', marks: [{ type: 'bold' }] },
            ],
          },
        ],
        [line('b')],
      ),
    );
    expect(importHTML('<div data-column><p>a</p></div>', registry).doc.content?.map((node) => node.type)).toEqual([
      'paragraph',
    ]);
  });

  it('draws in the Viewer with its columns weighed by the ratio', () => {
    const markup = renderToStaticMarkup(
      <Viewer doc={docOf({ ratio: [2, 1] }, [line('left')], [line('right')])} features={[columns(), standardKit()]} />,
    );
    expect(markup).toContain('--columns-ratio:minmax(0, 2fr) minmax(0, 1fr)');
    expect(markup.match(/data-slot="column"/g)).toHaveLength(2);
  });
});
