import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importHTML,
  importMarkdown,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { table } from './table';

const editors: IEditor[] = [];
function build(): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor().use(standardKit()).use(table()).build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

const registry = createCodecRegistry([standardKit(), table()]);
const cell = (text: string): DocJSON['content'] => [{ type: 'paragraph', content: [{ type: 'text', text }] }];
const tableDoc: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: cell('A') },
            { type: 'tableHeader', content: cell('B') },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: cell('1') },
            { type: 'tableCell', content: cell('2') },
          ],
        },
      ],
    },
  ],
};

describe('table', () => {
  it('inserts a table via insertTable', () => {
    const editor = build();
    editor.run('insertTable');
    expect(editor.getJSON().content?.some((n) => n.type === 'table')).toBe(true);
  });

  it('exports a GFM Markdown table', () => {
    const md = serialize(tableDoc, 'markdown', registry);
    expect(md).toContain('| A | B |');
    expect(md).toContain('| --- | --- |');
    expect(md).toContain('| 1 | 2 |');
  });

  it('exports an HTML table', () => {
    const html = serialize(tableDoc, 'html', registry);
    expect(html).toContain('<table>');
    expect(html).toContain('<th><p>A</p></th>');
    expect(html).toContain('<td><p>1</p></td>');
  });

  it('imports a GFM Markdown table', () => {
    const result = importMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('table');
    expect(node?.content?.[0]?.content?.[0]?.type).toBe('tableHeader');
    expect(node?.content?.[1]?.content?.[0]?.type).toBe('tableCell');
  });

  it('keeps a pipe in a cell, plain, escaped by the author or in code, inside its cell', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: cell('| a | b') },
                { type: 'tableHeader', content: cell('back\\|slash') },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x|y', marks: [{ type: 'code' }] }] }],
                },
                { type: 'tableCell', content: cell('2') },
              ],
            },
          ],
        },
      ],
    };
    expect(importMarkdown(serialize(doc, 'markdown', registry), registry).doc).toEqual(doc);
  });

  it('carries its column widths, its full width and the space around it through HTML', () => {
    const laid: DocJSON = {
      type: 'doc',
      content: [{ ...tableDoc.content![0], attrs: { columnWidths: [0.3, 0.7], width: 'full', spaceBefore: 'small' } }],
    };
    const html = serialize(laid, 'html', registry);
    expect(html).toMatch(/^<table data-column-widths="0.3,0.7" data-width="full" data-space-before="small">/);
    expect(importHTML(html, registry).doc.content?.[0].attrs).toEqual(laid.content?.[0].attrs);
  });

  it('writes no width it cannot read, and reads none back', () => {
    const laid: DocJSON = {
      type: 'doc',
      content: [{ ...tableDoc.content![0], attrs: { columnWidths: ['300px', 1], width: 0.5 } }],
    };
    expect(serialize(laid, 'html', registry)).toMatch(/^<table>/);
    const html =
      '<table data-column-widths="0.01,0.99" data-width="wide"><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>';
    expect(importHTML(html, registry).doc.content?.[0].attrs ?? {}).toEqual({});
  });

  it('imports its own HTML back with one paragraph in each cell', () => {
    expect(importHTML(serialize(tableDoc, 'html', registry), registry).doc).toEqual(tableDoc);
  });

  it("wraps a cell's bare text in a paragraph and keeps its blocks as they are", () => {
    const html =
      '<table><tbody><tr><td>plain <strong>bold</strong></td><td>lead<p>own</p><ul><li><p>item</p></li></ul></td></tr></tbody></table>';
    const [first, second] = importHTML(html, registry).doc.content?.[0].content?.[0].content ?? [];
    expect(first?.content).toEqual([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'plain ' },
          { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        ],
      },
    ]);
    expect(second?.content?.map((node) => node.type)).toEqual(['paragraph', 'paragraph', 'bulletList']);
    expect(second?.content?.[0]?.content).toEqual([{ type: 'text', text: 'lead' }]);
  });

  it("reads a pasted table's pixel column widths as shares of the table", () => {
    const html =
      '<table><tbody><tr><td colwidth="100"><p>a</p></td><td colwidth="300"><p>b</p></td></tr></tbody></table>';
    expect(importHTML(html, registry).doc.content?.[0].attrs).toEqual({ columnWidths: [0.25, 0.75] });
  });

  it('draws its column widths in the Viewer as a share of the table each', () => {
    const laid: DocJSON = {
      type: 'doc',
      content: [{ ...tableDoc.content![0], attrs: { columnWidths: [0.25, 0.75], width: 'full' } }],
    };
    const markup = renderToStaticMarkup(<Viewer doc={laid} features={[standardKit(), table()]} />);
    expect(markup).toContain('data-slot="table" data-width="full"');
    expect(markup).toContain('<col style="width:25%"/><col style="width:75%"/>');
  });
});
