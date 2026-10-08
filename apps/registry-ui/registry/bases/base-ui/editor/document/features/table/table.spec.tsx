import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importMarkdown, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { table } from './table.js';

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
});
