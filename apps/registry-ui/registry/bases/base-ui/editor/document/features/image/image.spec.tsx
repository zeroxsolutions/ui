import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type {
  DocJSON,
  IEditor,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { image } from './image.js';

const editors: IEditor[] = [];
function build(): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor()
    .use(standardKit())
    .use(image())
    .build({ element });
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
    expect(serialize(imageDoc, 'markdown', registry)).toContain(
      '![Cat](https://x/y.png)',
    );
    expect(serialize(imageDoc, 'html', registry)).toContain(
      '<img src="https://x/y.png"',
    );
  });

  it('round-trips through HTML', () => {
    const result = importHTML(
      '<img src="https://x/y.png" alt="Cat">',
      registry,
    );
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('image');
    expect(node?.attrs?.src).toBe('https://x/y.png');
    expect(node?.attrs?.alt).toBe('Cat');
  });
});
