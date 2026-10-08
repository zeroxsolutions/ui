import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importMarkdown, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from './standard-kit.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

const registry = createCodecRegistry([standardKit()]);
const para = (text: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('standardKit', () => {
  it('toggles a heading via its structural command', () => {
    const editor = build(para('Title'));
    editor.run('selectAll');
    expect(editor.run('toggleHeading', { level: 2 })).toBe(true);
    expect(editor.getJSON().content?.[0]?.type).toBe('heading');
    expect(editor.getJSON().content?.[0]?.attrs?.level).toBe(2);
  });

  it('toggles a standard mark', () => {
    const editor = build(para('hi'));
    editor.run('selectAll');
    editor.run('toggleMark', { name: 'bold' });
    expect(editor.isActive('bold')).toBe(true);
  });

  it('wraps the selection in a bullet list', () => {
    const editor = build(para('a'));
    editor.run('selectAll');
    editor.run('toggleBulletList');
    expect(editor.getJSON().content?.[0]?.type).toBe('bulletList');
  });

  it('exports standard blocks to Markdown', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'two', marks: [{ type: 'bold' }] }],
                },
              ],
            },
          ],
        },
      ],
    };
    const md = serialize(doc, 'markdown', registry);
    expect(md).toContain('# Title');
    expect(md).toContain('- one');
    expect(md).toContain('- **two**');
  });

  it('imports standard Markdown into blocks', () => {
    const result = importMarkdown('## Sub\n\n- a\n- b\n\n> quote', registry);
    const [heading, list, quote] = result.doc.content ?? [];
    expect(heading?.type).toBe('heading');
    expect(heading?.attrs?.level).toBe(2);
    expect(list?.type).toBe('bulletList');
    expect(quote?.type).toBe('blockquote');
  });
});
