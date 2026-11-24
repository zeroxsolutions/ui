import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../document/core/types/index.js';
import { createCodecRegistry } from '../document/serialize/create-codec-registry.js';
import { importHTML } from '../document/serialize/import-html.js';
import { importMarkdown } from '../document/serialize/import-markdown.js';
import { serialize } from '../document/serialize/serialize-to-string.js';
import { BlockDefinitionInvalid } from '../template/email/define-email-block.js';
import { choice, items, link, plainText, richText } from '../template/email/fields.js';
import { defineBlock, type Block } from './define-block.js';

const note = defineBlock({
  type: 'note',
  label: 'Note',
  fields: {
    title: plainText(),
    url: link(),
    text: richText(),
    tags: items({ fields: { name: plainText() }, max: 3 }),
  },
  attributes: { tone: choice(['plain', 'loud'], 'plain') },
  document: {
    html: (view, markup) =>
      markup`<a href="${markup.url(view.fields.url)}" title="${view.fields.title}">${view.fields.title}</a>${view.body}<span>${view.attributes.tone}</span>`,
  },
});

function registryOf(block: Block) {
  return createCodecRegistry([{ id: block.type, nodes: [block.document!.node], codecs: [block.document!.codec] }]);
}

const registry = registryOf(note);

function docOf(attrs: Record<string, unknown>, content?: NodeJSON[], type = 'note'): DocJSON {
  return { type: 'doc', content: [{ type, attrs, ...(content ? { content } : {}) }] };
}

const attrs = { title: 'Hi', url: 'https://x.test/a?b=1&c=2', tags: [{ name: 'a' }, { name: 'b' }], tone: 'loud' };

describe("a defined block's document codec", () => {
  it('round-trips through HTML, its attributes and its body', () => {
    const doc = docOf(attrs, [{ type: 'text', text: 'Body text' }]);
    const html = serialize(doc, 'html', registry);
    expect(html).toContain('<a href="https://x.test/a?b=1&amp;c=2" title="Hi">Hi</a>');
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('round-trips through Markdown as one HTML block, the body keeping bold, italic and links', () => {
    const doc = docOf(attrs, [
      { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' and ' },
      { type: 'text', text: 'a link', marks: [{ type: 'link', attrs: { href: 'https://y.test' } }] },
    ]);
    const markdown = serialize(doc, 'markdown', registry);
    expect(markdown.startsWith('<div data-block="note"')).toBe(true);
    expect(markdown).not.toMatch(/\n\s*\n/);
    expect(importMarkdown(markdown, registry).doc).toEqual(doc);
  });

  it('escapes a value in both formats, and reads it back as written', () => {
    const hostile = { title: '"><script>alert(1)</script>', url: '', tags: [], tone: 'plain' };
    const doc = docOf(hostile);
    for (const format of ['html', 'markdown'] as const) {
      const out = serialize(doc, format, registry);
      expect(out).not.toContain('<script>');
      expect(out).not.toContain('"><script');
    }
    expect(importHTML(serialize(doc, 'html', registry), registry).doc).toEqual(doc);
    expect(importMarkdown(serialize(doc, 'markdown', registry), registry).doc).toEqual(doc);
  });

  it('links nowhere for an address a reader would not open', () => {
    const html = serialize(docOf({ ...attrs, url: 'javascript:alert(1)' }), 'html', registry);
    expect(html).toContain('<a href=""');
    expect(html).not.toContain('href="javascript');
  });

  it('keeps a value holding a blank line and a comment end in one Markdown block', () => {
    const doc = docOf({ ...attrs, title: 'one\n\ntwo --> <!-- three' });
    const markdown = serialize(doc, 'markdown', registry);
    expect(markdown).not.toMatch(/\n\s*\n/);
    expect(importMarkdown(markdown, registry).doc).toEqual(doc);
  });

  it('drops a stored attribute it cannot read, and keeps the rest', () => {
    const html =
      '<div data-block="note" data-block-attrs="{&quot;tone&quot;:&quot;x&quot;,&quot;title&quot;:&quot;T&quot;,&quot;tags&quot;:5}"></div>';
    expect(importHTML(html, registry).doc).toEqual(docOf({ title: 'T' }));
    expect(importHTML('<div data-block="note" data-block-attrs="{nope"></div>', registry).doc).toEqual(docOf({}));
    expect(importHTML('<div data-block="other"></div>', registry).doc.content).toEqual([]);
  });

  it.each([
    ['a link attribute', (value: string) => `<a href="${value}">`],
    ['an image source', (value: string) => `<img src='${value}'>`],
    ['an event handler', (value: string) => `<b onclick="${value}">`],
    ['a style', (value: string) => `<b style="${value}">`],
    ['an unquoted attribute', (value: string) => `<b title=${value}>`],
    ['a script', (value: string) => `<script>${value}`],
  ])('refuses a value placed in %s', (_where, place) => {
    const [before, after] = place('\u0000').split('\u0000');
    const unsafe = defineBlock({
      type: 'unsafe',
      label: 'Unsafe',
      fields: { title: plainText() },
      document: {
        html: (view, markup) => markup(Object.assign([before, after], { raw: [before, after] }), view.fields.title),
      },
    });
    expect(() => serialize(docOf({ title: 'x' }, undefined, 'unsafe'), 'html', registryOf(unsafe))).toThrow(
      BlockDefinitionInvalid,
    );
  });
});
