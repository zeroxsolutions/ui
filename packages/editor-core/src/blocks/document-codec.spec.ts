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
    ['a link after a closing bracket in an earlier value', (value: string) => `<a title="1 > 0" href="${value}">`],
    ['a link after a comment opener in an earlier value', (value: string) => `<a title="<!--" href="${value}">`],
    ['a frame document', (value: string) => `<iframe srcdoc="${value}">`],
    ['an animation value', (value: string) => `<svg><a><animate attributeName="href" values="${value}"/>`],
    ['an animation target', (value: string) => `<svg><set attributeName="onmouseover" to="${value}"/>`],
    ['an animated attribute name', (value: string) => `<svg><set attributeName="${value}" to="x"/>`],
    ['a meta element', (value: string) => `<meta http-equiv="refresh" content="0;url=${value}">`],
    ['a noscript element', (value: string) => `<noscript>${value}`],
    ['a script in an svg', (value: string) => `<svg><script>${value}`],
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

describe("a defined block's markup fragments", () => {
  const tagged = (html: Parameters<typeof defineBlock>[0]['document']) =>
    defineBlock({
      type: 'tagged',
      label: 'Tagged',
      fields: { title: plainText(), url: link(), tags: items({ fields: { name: plainText() }, max: 3 }) },
      document: html,
    });
  const exported = (block: Block, attrs: Record<string, unknown>) =>
    serialize(docOf(attrs, undefined, block.type), 'html', registryOf(block));

  it('reads a tag opened in a fragment, so a value after it is checked in the tag', () => {
    const block = tagged({
      html: (view, markup) => markup`${markup`<a class="c"`} href="${view.fields.url}">x</a>`,
    });
    expect(() => exported(block, { url: 'javascript:alert(1)' })).toThrow(BlockDefinitionInvalid);
  });

  it('refuses a fragment holding a value where only text was checked for it', () => {
    const block = tagged({
      html: (view, markup) => markup`<a title="${markup`${view.fields.title}`}">x</a>`,
    });
    expect(() => exported(block, { title: 'x' })).toThrow(BlockDefinitionInvalid);
  });

  it('draws a list of fragments, as an items field is drawn', () => {
    const block = tagged({
      html: (view, markup) =>
        markup`<ul>${(view.fields.tags as readonly { name: string }[]).map((tag) => markup`<li>${tag.name}</li>`)}</ul>`,
    });
    expect(exported(block, { tags: [{ name: '<b>' }, { name: 'c' }] })).toContain(
      '<ul><li>&lt;b&gt;</li><li>c</li></ul>',
    );
  });

  it('keeps a template line break out of Markdown, however the template ends its lines', () => {
    const block = tagged({ html: (view, markup) => markup`<p>${view.fields.title}</p>\r\n\r\n<p>end</p>` });
    const markdown = serialize(docOf({ title: 'x' }, undefined, 'tagged'), 'markdown', registryOf(block));
    expect(markdown).not.toMatch(/\n\s*\n/);
  });
});

describe("a defined block's body", () => {
  it('escapes its text in HTML, and reads it back as written', () => {
    const doc = docOf(attrs, [{ type: 'text', text: '</div><img src=x onerror=alert(1)> & more' }]);
    const html = serialize(doc, 'html', registry);
    expect(html).not.toContain('<img');
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('drops a link a reader would not open from a Markdown body, keeping its text', () => {
    const markdown = serialize(docOf(attrs, [{ type: 'text', text: 'x' }]), 'markdown', registry).replace(
      '&quot;text&quot;:&quot;x&quot;',
      '&quot;text&quot;:&quot;[go](javascript:void0)&quot;',
    );
    expect(importMarkdown(markdown, registry).doc).toEqual(docOf(attrs, [{ type: 'text', text: 'go' }]));
  });

  it('keeps an item that leaves a field out', () => {
    const html = '<div data-block="note" data-block-attrs="{&quot;tags&quot;:[{}]}"></div>';
    expect(importHTML(html, registry).doc).toEqual(docOf({ tags: [{}] }));
  });
});
