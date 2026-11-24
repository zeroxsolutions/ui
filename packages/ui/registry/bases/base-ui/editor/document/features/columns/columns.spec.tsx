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

  it("writes Markdown as each column's blocks in order, a blank line between columns", () => {
    const doc = docOf({ ratio: [1, 1] }, [line('left')], [line('right')]);
    expect(serialize(doc, 'markdown', registry).trim()).toBe('left\n\nright');
  });

  it('drops a ratio it cannot read, and keeps the columns', () => {
    const html = '<div data-columns data-ratio="1,x"><div data-column><p>a</p></div><div data-column></div></div>';
    expect(importHTML(html, registry).doc).toEqual(docOf({}, [line('a')], [{ type: 'paragraph' }]));
  });

  it('draws in the Viewer with its columns weighed by the ratio', () => {
    const markup = renderToStaticMarkup(
      <Viewer doc={docOf({ ratio: [2, 1] }, [line('left')], [line('right')])} features={[columns(), standardKit()]} />,
    );
    expect(markup).toContain('--columns-ratio:minmax(0, 2fr) minmax(0, 1fr)');
    expect(markup.match(/data-slot="column"/g)).toHaveLength(2);
  });
});
