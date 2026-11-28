import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { Viewer } from '../../react/viewer';
import { standardKit } from './standard-kit';

const registry = createCodecRegistry([standardKit()]);

const text = (value: string, marks?: NodeJSON['marks']): NodeJSON => ({
  type: 'text',
  text: value,
  ...(marks ? { marks } : {}),
});

const styled: DocJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2, textAlign: 'end' }, content: [text('Title')] },
    { type: 'paragraph', attrs: { textAlign: 'center', size: 'lead' }, content: [text('Lead line')] },
    { type: 'paragraph', attrs: { size: 'small', spaceBefore: 'large' }, content: [text('Fine print')] },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', attrs: { textAlign: 'justify' }, content: [text('Said')] }],
    },
    {
      type: 'paragraph',
      content: [
        text('red', [{ type: 'textColor', attrs: { token: 'red' } }]),
        text(' and '),
        text('washed', [{ type: 'textBackground', attrs: { token: 'amber' } }]),
      ],
    },
  ],
};

const blocks = (doc: DocJSON) => doc.content ?? [];

describe('the standard text styles in HTML and Markdown', () => {
  it('writes alignment and size as data attributes and reads them back', () => {
    const html = serialize(styled, 'html', registry);

    expect(html).toContain('<h2 data-text-align="end">');
    expect(html).toContain('<p data-text-align="center" data-size="lead">');
    expect(html).toContain('<p data-space-before="large" data-size="small">');
    expect(html).toContain('<blockquote><p data-text-align="justify">');

    const [heading, lead, small, quote] = blocks(importHTML(html, registry).doc);
    expect(heading?.attrs).toMatchObject({ level: 2, textAlign: 'end' });
    expect(lead?.attrs).toMatchObject({ textAlign: 'center', size: 'lead' });
    expect(small?.attrs).toMatchObject({ size: 'small', spaceBefore: 'large' });
    expect(quote?.content?.[0]?.attrs).toMatchObject({ textAlign: 'justify' });
  });

  it('writes the colours as token spans and reads them back', () => {
    const html = serialize(styled, 'html', registry);

    expect(html).toContain('<span data-color="red">red</span>');
    expect(html).toContain('<span data-bg="amber">washed</span>');

    const coloured = blocks(importHTML(html, registry).doc)[4]?.content ?? [];
    expect(coloured[0]?.marks).toEqual([{ type: 'textColor', attrs: { token: 'red' } }]);
    expect(coloured[2]?.marks).toEqual([{ type: 'textBackground', attrs: { token: 'amber' } }]);
  });

  it('keeps only the text in Markdown', () => {
    const markdown = serialize(styled, 'markdown', registry);

    expect(markdown).toBe('## Title\n\nLead line\n\nFine print\n\n> Said\n\nred and washed');
  });

  it('maps an imported inline alignment and a hue name, and drops every other colour', () => {
    const { doc } = importHTML(
      '<p style="text-align:right;width:300px"><span style="color:#ff0000">a</span>' +
        '<span style="color:red">b</span><span style="background:rgb(1,2,3)">c</span></p>',
      registry,
    );

    const [line] = blocks(doc);
    expect(line?.attrs).toEqual({ textAlign: 'end' });
    expect(line?.content?.map((node) => node.marks ?? [])).toEqual([
      [],
      [{ type: 'textColor', attrs: { token: 'red' } }],
      [],
    ]);
    expect(JSON.stringify(doc)).not.toMatch(/\d+px|#[0-9a-f]{3,8}|rgb\(/i);
  });
});

describe('the Viewer', () => {
  it('draws the alignment, the size and the colours the editor draws', () => {
    const html = renderToStaticMarkup(<Viewer doc={styled} features={[standardKit()]} />);

    expect(html).toContain('<h2 data-text-align="end">Title</h2>');
    expect(html).toContain('<p data-text-align="center" data-size="lead">Lead line</p>');
    expect(html).toContain('<span data-color="red">red</span>');
    expect(html).toContain('<span data-bg="amber">washed</span>');
  });

  it("draws each task's checkbox, ticked as the editor's is", () => {
    const tasks: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [true, false].map((checked) => ({
            type: 'taskItem',
            attrs: { checked },
            content: [{ type: 'paragraph', content: [text(checked ? 'Done' : 'Open')] }],
          })),
        },
      ],
    };
    const html = renderToStaticMarkup(<Viewer doc={tasks} features={[standardKit()]} />);

    expect(html.match(/role="checkbox"/g)).toHaveLength(2);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
  });
});
