import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createCodecRegistry,
  importHTML,
  importMarkdown,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { link } from './link';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(link());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

const registry = createCodecRegistry([standardKit(), link()]);
const linkedDoc: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'site',
          marks: [{ type: 'link', attrs: { href: 'https://x.com' } }],
        },
      ],
    },
  ],
};

describe('link', () => {
  it('applies the link mark via setLink', () => {
    const editor = build({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
    });
    editor.run('selectAll');
    editor.run('setLink', { href: 'https://x.com' });
    expect(editor.isActive('link')).toBe(true);
  });

  it('exports a link to Markdown and HTML', () => {
    expect(serialize(linkedDoc, 'markdown', registry)).toContain('[site](https://x.com)');
    expect(serialize(linkedDoc, 'html', registry)).toContain('<a href="https://x.com"');
  });

  it('imports a Markdown link into a link mark', () => {
    const result = importMarkdown('[site](https://x.com)', registry);
    const textNode = result.doc.content?.[0]?.content?.[0];
    expect(textNode?.text).toBe('site');
    expect(textNode?.marks?.[0]?.type).toBe('link');
    expect(textNode?.marks?.[0]?.attrs?.href).toBe('https://x.com');
  });
});

/** The address of the link mark on the first text of `doc`'s first block, or undefined for none. */
function linkOf(doc: DocJSON): unknown {
  const text = doc.content?.[0]?.content?.[0];
  return text?.marks?.find((mark) => mark.type === 'link')?.attrs?.href;
}

const unsafe = [
  'javascript:alert(1)',
  ' JaVaScRiPt:alert(1)',
  'java\tscript:alert(1)',
  'java\nscript:alert(1)',
  '\u0001javascript:alert(1)',
  'vbscript:msgbox(1)',
  'data:text/html,<script>alert(1)</script>',
  'file:///etc/passwd',
];
const safe = [
  'https://x.com/a?b=1',
  'http://x.com',
  'mailto:a@b.c',
  'tel:+84123',
  '#day-one',
  '/trips/hoi-an',
  'notes.html',
];

const escapedAttribute = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

describe('a link to an address that runs or loads a document', () => {
  it.each(unsafe)('is dropped from an HTML import, its text kept: %j', (href) => {
    const result = importHTML(`<p><a href="${escapedAttribute(href)}">site</a></p>`, registry);
    expect(result.doc.content?.[0]?.content?.[0]?.text).toBe('site');
    expect(linkOf(result.doc)).toBeUndefined();
  });

  it.each(unsafe)('is dropped from a Markdown import, its text kept: %j', (href) => {
    const result = importMarkdown(`[site](<${href.replace(/[<>\n]/g, '')}>)`, registry);
    expect(result.doc.content?.[0]?.content?.[0]?.text).toBe('site');
    expect(linkOf(result.doc)).toBeUndefined();
  });

  it.each(unsafe)('is refused by setLink: %j', (href) => {
    const editor = build({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] });
    editor.run('selectAll');
    expect(editor.run('setLink', { href })).toBe(false);
    expect(editor.isActive('link')).toBe(false);
  });

  it.each(unsafe)('is not kept from HTML the editor parses, as a paste is: %j', (href) => {
    const editor = build();
    editor.run('insertContent', { content: `<p><a href="${escapedAttribute(href)}">site</a></p>` });
    expect(JSON.stringify(editor.getJSON())).not.toContain('"link"');
  });

  it.each(unsafe)('is written without its address in every export of a stored document: %j', (href) => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'site', marks: [{ type: 'link', attrs: { href } }] }] },
      ],
    };
    const rendered = renderToStaticMarkup(<Viewer doc={doc} features={[standardKit(), link()]} />);
    for (const exported of [serialize(doc, 'html', registry), serialize(doc, 'markdown', registry), rendered]) {
      expect(exported.toLowerCase()).not.toMatch(/script:|data:|file:/);
      expect(exported).toContain('site');
    }
  });
});

describe('a link to a web, mail or phone address, or one in the site', () => {
  it.each(safe)('survives an HTML and a Markdown import: %s', (href) => {
    expect(linkOf(importHTML(`<p><a href="${href}">site</a></p>`, registry).doc)).toBe(href);
    expect(linkOf(importMarkdown(`[site](${href})`, registry).doc)).toBe(href);
  });

  it.each(safe)('is set by setLink and drawn by the Viewer: %s', (href) => {
    const editor = build({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] });
    editor.run('selectAll');
    expect(editor.run('setLink', { href })).toBe(true);
    const rendered = renderToStaticMarkup(<Viewer doc={editor.getJSON()} features={[standardKit(), link()]} />);
    expect(rendered).toContain(`href="${href.replace(/&/g, '&amp;')}"`);
  });
});
