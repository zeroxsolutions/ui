import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import { createCodecRegistry } from '../../document/serialize/create-codec-registry.js';
import { importHTML } from '../../document/serialize/import-html.js';
import { importMarkdown } from '../../document/serialize/import-markdown.js';
import { serialize } from '../../document/serialize/serialize-to-string.js';
import type { Block } from '../define-block.js';
import { bookmark, contentsOf, file, fileSizeText, media, tableOfContents } from './index.js';

const blocks: readonly Block[] = [bookmark, file, media, tableOfContents];
const registry = createCodecRegistry(
  blocks.map((block) => ({ id: block.type, nodes: [block.document!.node], codecs: [block.document!.codec] })),
);

function docOf(type: string, attrs: Record<string, unknown>): DocJSON {
  return { type: 'doc', content: [{ type, attrs }] };
}

const html = (doc: DocJSON): string => serialize(doc, 'html', registry);

describe('the library blocks', () => {
  it.each([
    [
      'bookmark',
      {
        url: 'https://example.com/a?b=1&c=2',
        title: 'Example',
        description: 'A page',
        image: 'https://example.com/a.png',
      },
    ],
    ['bookmark', { url: 'https://example.com' }],
    ['file', { name: 'report.pdf', href: 'https://files.test/report.pdf', size: 1536 }],
    ['media', { src: 'https://cdn.test/a.mp4', caption: 'Launch', poster: 'https://cdn.test/a.jpg' }],
    ['media', { src: 'https://cdn.test/a.mp3', kind: 'audio' }],
    ['tableOfContents', {}],
  ])('round-trips a %s through HTML and Markdown', (type, attrs) => {
    const doc = docOf(type, attrs);
    expect(importHTML(html(doc), registry).doc).toEqual(doc);
    expect(importMarkdown(serialize(doc, 'markdown', registry), registry).doc).toEqual(doc);
  });

  it('exports a bookmark as a link to its address, its title, description and image', () => {
    expect(
      html(
        docOf('bookmark', {
          url: 'https://example.com',
          title: 'Ex',
          description: 'Page',
          image: 'https://i.test/x.png',
        }),
      ),
    ).toContain(
      '<a href="https://example.com" data-bookmark><span data-bookmark-title>Ex</span><span data-bookmark-description>Page</span><span data-bookmark-url>https://example.com</span><img src="https://i.test/x.png" alt=""></a>',
    );
  });

  it('titles a bookmark without a title by its address', () => {
    expect(html(docOf('bookmark', { url: 'https://example.com' }))).toContain(
      '<span data-bookmark-title>https://example.com</span>',
    );
  });

  it('exports a file as a download link with its size', () => {
    expect(html(docOf('file', { name: 'a.pdf', href: 'https://f.test/a.pdf', size: 2048 }))).toContain(
      '<a href="https://f.test/a.pdf" download data-file><span data-file-name>a.pdf</span><span data-file-size>2 KB</span></a>',
    );
  });

  it('names a file without a name by its link, as its view does', () => {
    expect(html(docOf('file', { href: 'https://f.test/a.pdf' }))).toContain(
      '<span data-file-name>https://f.test/a.pdf</span>',
    );
  });

  it('exports a video with its controls and poster, and an audio with its controls', () => {
    expect(
      html(docOf('media', { src: 'https://c.test/a.mp4', poster: 'https://c.test/a.jpg', caption: 'Hi' })),
    ).toContain(
      '<figure data-media="video"><video controls src="https://c.test/a.mp4" poster="https://c.test/a.jpg"></video><figcaption>Hi</figcaption></figure>',
    );
    expect(html(docOf('media', { src: 'https://c.test/a.mp3', kind: 'audio' }))).toContain(
      '<figure data-media="audio"><audio controls src="https://c.test/a.mp3"></audio></figure>',
    );
  });

  it.each([
    ['bookmark', { url: 'javascript:alert(1)', image: 'javascript:alert(2)' }],
    ['file', { name: 'x', href: ' JavaScript:alert(1)' }],
    ['media', { src: 'javascript:alert(1)', poster: 'data:text/html,<script>alert(1)</script>' }],
  ])('writes no address a %s holds that is not a web or mail address', (type, attrs) => {
    const exported = html(docOf(type, attrs));
    for (const attribute of ['href', 'src', 'poster']) {
      for (const [, value] of exported.matchAll(new RegExp(`\\b${attribute}="([^"]*)"`, 'g'))) {
        expect(value).toBe('');
      }
    }
    expect(exported.toLowerCase()).not.toMatch(/(href|src|poster)="\s*(javascript|data):/);
  });

  it('escapes a field holding markup, in HTML and in Markdown', () => {
    const doc = docOf('bookmark', { url: 'https://e.test', title: '"><script>alert(1)</script>' });
    for (const exported of [html(doc), serialize(doc, 'markdown', registry)]) {
      expect(exported).not.toContain('<script');
    }
    expect(importMarkdown(serialize(doc, 'markdown', registry), registry).doc).toEqual(doc);
  });

  it('keeps a Markdown file block one token when its name holds a blank line and a comment end', () => {
    const doc = docOf('file', { name: 'a\n\nb -->', href: 'https://f.test/a' });
    const markdown = serialize(doc, 'markdown', registry);
    expect(markdown).not.toMatch(/\n\s*\n/);
    expect(importMarkdown(markdown, registry).doc).toEqual(doc);
  });

  it('drops a size or a kind out of bounds on import', () => {
    const stored = docOf('file', { name: 'a', href: 'https://f.test/a', size: 2 ** 31 + 1 });
    expect(importHTML(html(stored), registry).doc).toEqual(docOf('file', { name: 'a', href: 'https://f.test/a' }));
    const media: NodeJSON = { type: 'media', attrs: { src: 'https://c.test/a', kind: 'film' } };
    expect(importHTML(html({ type: 'doc', content: [media] }), registry).doc).toEqual(
      docOf('media', { src: 'https://c.test/a' }),
    );
  });
});

describe('fileSizeText', () => {
  it.each([
    [0, ''],
    [-1, ''],
    [Number.NaN, ''],
    [512, '512 B'],
    [1536, '1.5 KB'],
    [10 * 1024, '10 KB'],
    [1024 * 1024, '1 MB'],
    [2 ** 31, '2 GB'],
  ])('reads %d bytes as "%s"', (bytes, text) => {
    expect(fileSizeText(bytes)).toBe(text);
  });
});

describe('contentsOf', () => {
  const heading = (level: number, text: string): NodeJSON => ({
    type: 'heading',
    attrs: { level },
    content: text === '' ? [] : [{ type: 'text', text }],
  });

  it('lists the headings of level 1 to 3 in order, wherever they sit, a toggle heading included', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        heading(1, 'Trip'),
        { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
        { type: 'toggleHeading', attrs: { open: false }, content: [heading(2, 'Day one'), heading(3, 'Morning')] },
        heading(4, 'Too deep'),
        { type: 'callout', content: [heading(2, 'Note')] },
        heading(3, 'Night'),
      ],
    };
    expect(contentsOf(doc)).toEqual([
      { level: 1, text: 'Trip', index: 0 },
      { level: 2, text: 'Day one', index: 1 },
      { level: 3, text: 'Morning', index: 2 },
      { level: 2, text: 'Note', index: 3 },
      { level: 3, text: 'Night', index: 4 },
    ]);
  });

  it('leaves out a heading with no text, which still takes its place among the headings', () => {
    const doc: DocJSON = { type: 'doc', content: [heading(2, ''), heading(2, 'Kept')] };
    expect(contentsOf(doc)).toEqual([{ level: 2, text: 'Kept', index: 1 }]);
  });

  it('reads a level as the heading codec draws it: missing, zero or not a number as 1, past 6 as 6', () => {
    const stored = (level: unknown, text: string): NodeJSON => ({
      type: 'heading',
      attrs: { level },
      content: [{ type: 'text', text }],
    });
    const doc: DocJSON = {
      type: 'doc',
      content: [
        stored(0, 'zero'),
        stored('abc', 'nan'),
        stored(undefined, 'none'),
        stored(7, 'seven'),
        stored(2, 'two'),
      ],
    };
    expect(contentsOf(doc)).toEqual([
      { level: 1, text: 'zero', index: 0 },
      { level: 1, text: 'nan', index: 1 },
      { level: 1, text: 'none', index: 2 },
      { level: 2, text: 'two', index: 3 },
    ]);
  });
});
