import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../core/index.js';
import type { DocJSON, IEditor } from '../../core/index.js';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
} from '../../serialize/index.js';
import { standardKit } from '../standard/index.js';
import { link } from './link.js';

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
        { type: 'text', text: 'site', marks: [{ type: 'link', attrs: { href: 'https://x.com' } }] },
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
