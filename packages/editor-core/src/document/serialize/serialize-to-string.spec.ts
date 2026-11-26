import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineFeature } from '../core/define-feature.js';
import type { SerializeContext } from '../core/index.js';
import type { EditorFeature } from '../core/types/feature.js';
import type { DocJSON, MarkJSON, NodeJSON } from '../core/types/json.js';
import { createCodecRegistry } from './create-codec-registry.js';
import { importMarkdown } from './import-markdown.js';
import { serialize } from './serialize-to-string.js';
import { validateDoc, type ImportReport } from './validate-doc.js';

/** Bold, inline code, a link that reads back any address, and a hard break, as a document's features write them. */
const marks: EditorFeature = {
  id: 'marks',
  codecs: [{ node: 'hardBreak', toMarkdown: () => '  \n' }],
  markCodecs: [
    {
      mark: 'bold',
      toMarkdown: () => ({ open: '**', close: '**' }),
      fromMarkdown: (token) => (token.type === 'strong' ? { type: 'bold' } : null),
    },
    {
      mark: 'code',
      toMarkdown: () => ({ open: '`', close: '`', codeSpan: true }),
      fromMarkdown: (token) => (token.type === 'inlineCode' ? { type: 'code' } : null),
    },
    {
      mark: 'link',
      toMarkdown: (mark) => ({ open: '[', close: `](${String(mark.attrs?.href)})` }),
      fromMarkdown: (token) => (token.type === 'link' ? { type: 'link', attrs: { href: token.url } } : null),
    },
  ],
};
const registry = createCodecRegistry([marks]);

const text = (value: string, ...on: MarkJSON[]): NodeJSON => ({
  type: 'text',
  text: value,
  ...(on.length ? { marks: on } : {}),
});
const docOf = (...content: NodeJSON[]): DocJSON => ({ type: 'doc', content: [{ type: 'paragraph', content }] });
const markdownOf = (doc: DocJSON): string => serialize(doc, 'markdown', registry);
const readBack = (doc: DocJSON): DocJSON => importMarkdown(markdownOf(doc), registry).doc;

describe('serialize', () => {
  it('writes text as text in HTML, so an author cannot write markup into the export', () => {
    const doc = docOf(text('<b onclick="x">&</b>'));
    expect(serialize(doc, 'html', createCodecRegistry())).toBe('<p>&lt;b onclick=&quot;x&quot;&gt;&amp;&lt;/b&gt;</p>');
  });

  it('writes text that spells a link as text in Markdown, a javascript: one included', () => {
    const doc = docOf(text('[click](javascript:alert(1)) and <javascript:alert(2)>'));
    expect(markdownOf(doc)).toBe('\\[click\\](javascript:alert(1)) and \\<javascript:alert(2)\\>');
    expect(readBack(doc)).toEqual(doc);
  });

  it("keeps a link's text from closing the link and opening another", () => {
    const doc = docOf(text('a](javascript:alert(1)) [b', { type: 'link', attrs: { href: 'https://x.test' } }));
    expect(readBack(doc)).toEqual(doc);
  });

  it.each([
    '<details data-toggle-heading open><summary><h2>Day one</h2></summary>',
    '<div data-block="note" data-block-attrs="{}"></div>',
    '<script>alert(1)</script>',
    '<!-- a comment -->',
  ])('writes the raw HTML %s in a paragraph as text, which reads back as the same paragraph', (html) => {
    const doc = docOf(text(html));
    expect(markdownOf(doc)).not.toMatch(/(^|[^\\])</);
    expect(readBack(doc)).toEqual(doc);
  });

  it.each([
    '# a heading',
    '###### a heading',
    '> a quote',
    '- a bullet',
    '+ a bullet',
    '* a bullet',
    '1. an ordered item',
    '12) an ordered item',
    '| a | b |',
    '   - an indented bullet',
    '    an indented code block',
    '\tan indented code block',
    '---',
    '***',
    '___',
    '```js',
    '~~~',
    '===',
  ])('writes a paragraph opening with %j so it reads back as that paragraph', (opening) => {
    const doc = docOf(text(opening));
    expect(readBack(doc)).toEqual(doc);
  });

  it.each([
    ['heading', 'first line\n# second'],
    ['list', 'first line\n- second'],
    ['ordered list', 'first line\n2. second'],
    ['setext heading', 'first line\n==='],
    ['setext heading of dashes', 'first line\n---'],
    ['table', 'name | price\n:-- | --'],
    ['hard break', 'first line  \nsecond'],
  ])('writes a line inside text so it starts no %s', (_kind, value) => {
    const doc = docOf(text(value));
    expect(readBack(doc)).toEqual(doc);
  });

  it('writes the line after a hard break so it starts no block', () => {
    const doc = docOf(text('first'), { type: 'hardBreak' }, text('# second'));
    expect(markdownOf(doc)).toBe('first  \n\\# second');
  });

  it('round-trips text holding each special, plain and inside bold', () => {
    const specials = 'a \\ b * c _ d [e] <f> `g` ~h~ |i| &amp; &#106; &#x6A; AT&T 3 > 2 # 1. ==x== !';
    expect(readBack(docOf(text(specials)))).toEqual(docOf(text(specials)));
    const bold = docOf(text('plain '), text(specials, { type: 'bold' }));
    expect(readBack(bold)).toEqual(bold);
  });

  it('leaves an ampersand that starts no character reference as it is', () => {
    expect(markdownOf(docOf(text('AT&T & co')))).toBe('AT&T & co');
  });

  it('writes the text of inline code as it is, as a code span reads it', () => {
    const doc = docOf(text('see '), text('*a* [b](c) <d>', { type: 'code' }));
    expect(markdownOf(doc)).toBe('see `*a* [b](c) <d>`');
    expect(readBack(doc)).toEqual(doc);
  });

  it.each([
    ['a backtick', 'x` <img src=x onerror=alert(1)> `'],
    ['a run of backticks', 'a``b```c'],
    ['an opening backtick', '`a'],
    ['spaces around it', ' a '],
    ['HTML', '<b>bold</b>'],
  ])('keeps inline code holding %s inside one code span', (_kind, value) => {
    const doc = docOf(text('see '), text(value, { type: 'code' }), text(' after'));
    expect(markdownOf(doc)).not.toMatch(/(^|[^`\\])<(img|b)\b[^`]*$/);
    expect(readBack(doc)).toEqual(doc);
  });

  it('writes bold inline code as code inside the bold', () => {
    const doc = docOf(text('a*b', { type: 'bold' }, { type: 'code' }));
    expect(markdownOf(doc)).toBe('**`a*b`**');
    expect(readBack(doc)).toEqual(docOf(text('a*b', { type: 'bold' }, { type: 'code' })));
  });

  it.each([
    ['1', '. an item'],
    ['12', ') an item'],
    ['1', '2. an item'],
  ])('starts no ordered list from a number and its delimiter in two text nodes', (number, rest) => {
    const doc = docOf(text(number), text(rest));
    expect(readBack(doc)).toEqual(docOf(text(number + rest)));
  });

  it.each([
    ['a web address', 'see https://x.test/a now'],
    ['a www address', 'see www.x.test now'],
    ['a mail address', 'write to a@x.test now'],
  ])('reads %s written as text back as text, with no link', (_kind, value) => {
    const doc = docOf(text(value));
    expect(readBack(doc)).toEqual(doc);
  });

  it('keeps a link written as a link a link', () => {
    const doc = docOf(text('https://x.test', { type: 'link', attrs: { href: 'https://x.test' } }));
    expect(readBack(doc)).toEqual(doc);
  });

  it("keeps a closing # in a heading's text", () => {
    const headings = createCodecRegistry([
      marks,
      {
        id: 'heading',
        codecs: [
          {
            node: 'heading',
            toMarkdown: (node, ctx) => `## ${ctx.serializeChildren(node)}`,
            fromMarkdown: (token, ctx) =>
              token.type === 'heading' ? { type: 'heading', content: ctx.fromMarkdownChildren(token) } : null,
          },
        ],
      },
    ]);
    const doc: DocJSON = { type: 'doc', content: [{ type: 'heading', content: [text('Title #')] }] };
    expect(importMarkdown(serialize(doc, 'markdown', headings), headings).doc).toEqual(doc);
  });

  it('writes a line break inside inline code as a space, so the code opens no block', () => {
    const doc = docOf(text('a\n# b', { type: 'code' }));
    expect(readBack(doc)).toEqual(docOf(text('a # b', { type: 'code' })));
  });

  it('keeps the links of a file that opens with a byte order mark', () => {
    expect(importMarkdown('\uFEFF[a](https://x.test) and <https://y.test>', registry).doc).toEqual(
      docOf(
        text('a', { type: 'link', attrs: { href: 'https://x.test' } }),
        text(' and '),
        text('https://y.test', { type: 'link', attrs: { href: 'https://y.test' } }),
      ),
    );
  });
});

describe('the codec walkers over the features a registry holds', () => {
  const strong = defineFeature({
    id: 'strong',
    marks: [{ name: 'bold', htmlTag: 'strong' }],
    markCodecs: [
      {
        mark: 'bold',
        toMarkdown: () => ({ open: '**', close: '**' }),
        toHTML: () => ({ open: '<strong>', close: '</strong>' }),
        fromMarkdown: (token) => (token.type === 'strong' ? { type: 'bold' } : null),
      },
    ],
  });
  // A block whose Markdown is a fenced `diagram` code block, as a custom block's is.
  const diagram = defineFeature({
    id: 'diagram',
    nodes: [{ name: 'diagram', group: 'block', atom: true, attrs: z.object({ source: z.string() }) }],
    codecs: [
      {
        node: 'diagram',
        toMarkdown: (node) => '```diagram\n' + String(node.attrs?.source ?? '') + '\n```',
        toHTML: (node) => `<pre data-diagram>${String(node.attrs?.source ?? '')}</pre>`,
        fromMarkdown: (token) =>
          token.type === 'code' && token.lang === 'diagram'
            ? { type: 'diagram', attrs: { source: token.value ?? '' } }
            : null,
      },
    ],
  });
  const featured = createCodecRegistry([strong, diagram]);
  const paragraph = (...content: NodeJSON[]): NodeJSON => ({ type: 'paragraph', content });
  const sample: DocJSON = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [text('hello '), text('world', { type: 'bold' })] },
      { type: 'diagram', attrs: { source: 'A-->B' } },
    ],
  };

  it("writes each node and mark through its feature's codec, in Markdown and in HTML", () => {
    expect(serialize(sample, 'markdown', featured)).toBe('hello **world**\n\n```diagram\nA-->B\n```');
    expect(serialize(sample, 'html', featured)).toBe(
      '<p>hello <strong>world</strong></p><pre data-diagram>A-->B</pre>',
    );
  });

  it('writes the text of a node no codec reads, rather than throwing', () => {
    const doc: DocJSON = { type: 'doc', content: [{ type: 'unknownWrapper', content: [paragraph(text('x'))] }] };
    expect(serialize(doc, 'markdown', createCodecRegistry([]))).toContain('x');
  });

  it("reads a custom block back from its Markdown through its codec's token", () => {
    const [line, block] = importMarkdown('hello **world**\n\n```diagram\nA-->B\n```', featured).doc.content ?? [];
    expect(line?.content?.[1]?.marks).toEqual([{ type: 'bold' }]);
    expect(block).toEqual({ type: 'diagram', attrs: { source: 'A-->B' } });
  });

  it('reports what an import could not read instead of dropping it unseen', () => {
    const result = importMarkdown('| a | b |\n| - | - |\n| 1 | 2 |', featured);
    expect(result.dropped.map(({ source }) => source)).toContain('table');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('drops a node whose attributes its schema refuses, and reports it', () => {
    const report: ImportReport = { warnings: [], dropped: [] };
    const doc = validateDoc({ type: 'doc', content: [{ type: 'diagram', attrs: { source: 123 } }] }, featured, report);
    expect(doc.content).toEqual([]);
    expect(report.dropped.map(({ source }) => source)).toEqual(['diagram']);
  });

  it('writes a format registered after the registry was built', () => {
    const custom = createCodecRegistry([]);
    custom.registerNodeSerializer(
      'bbcode',
      'paragraph',
      (node, context) => `[p]${(context as SerializeContext).serializeChildren(node)}[/p]`,
    );
    expect(serialize({ type: 'doc', content: [paragraph(text('hi'))] }, 'bbcode', custom)).toBe('[p]hi[/p]');
  });
});
