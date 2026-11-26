import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index';
import { Viewer } from '../../react/viewer';
import { image } from './image';

const editors: IEditor[] = [];
function build(): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor().use(standardKit()).use(image()).build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

const registry = createCodecRegistry([standardKit(), image()]);
const imageDoc: DocJSON = {
  type: 'doc',
  content: [
    {
      type: 'image',
      attrs: { src: 'https://x/y.png', alt: 'Cat', title: '', width: null },
    },
  ],
};

describe('image', () => {
  it('inserts an image via insertImage', () => {
    const editor = build();
    editor.run('insertImage', { src: 'https://x/y.png', alt: 'Cat' });
    const node = editor.getJSON().content?.find((n) => n.type === 'image');
    expect(node?.attrs?.src).toBe('https://x/y.png');
    expect(node?.attrs?.alt).toBe('Cat');
  });

  it('exports to Markdown and HTML', () => {
    expect(serialize(imageDoc, 'markdown', registry)).toContain('![Cat](https://x/y.png)');
    expect(serialize(imageDoc, 'html', registry)).toContain('<img src="https://x/y.png"');
  });

  it('round-trips through HTML', () => {
    const result = importHTML('<img src="https://x/y.png" alt="Cat">', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('image');
    expect(node?.attrs?.src).toBe('https://x/y.png');
    expect(node?.attrs?.alt).toBe('Cat');
  });

  it('round-trips a caption, a link and the layout through HTML', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            src: 'https://x/y.png',
            alt: 'Cat',
            title: '',
            caption: 'A "cat"',
            href: 'https://x/c',
            align: 'center',
            width: 0.5,
          },
        },
      ],
    };
    const html = serialize(doc, 'html', registry);
    expect(html).toContain('data-align="center" data-width="0.5"');
    expect(html).toContain('data-caption="A &quot;cat&quot;" data-href="https://x/c"');
    expect(importHTML(html, registry).doc).toEqual(doc);
  });

  it('writes a stored pixel width as a share, and reads an exported pixel width as one', () => {
    const stored: DocJSON = {
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'https://x/y.png', width: 360 } }],
    };
    const html = serialize(stored, 'html', registry);
    expect(html).toContain('data-width="0.5"');
    expect(html).not.toMatch(/\swidth="/);
    const read = importHTML('<img src="https://x/y.png" alt="" width="180">', registry).doc.content?.[0];
    expect(read?.attrs?.width).toBe(0.25);
  });

  it('draws its caption, and links it in the Viewer only to an address a reader would open', () => {
    const viewed = (href: string) =>
      renderToStaticMarkup(
        <Viewer
          doc={{
            type: 'doc',
            content: [{ type: 'image', attrs: { src: 'https://x/y.png', alt: 'Cat', caption: 'Lunch', href } }],
          }}
          features={[standardKit(), image()]}
        />,
      );
    expect(viewed('https://x/c')).toMatch(/<a href="https:\/\/x\/c"[^>]*><img/);
    expect(viewed('https://x/c')).toContain('<figcaption');
    expect(viewed('https://x/c')).toContain('Lunch');
    expect(viewed('javascript:alert(1)')).not.toContain('<a ');
  });
});
