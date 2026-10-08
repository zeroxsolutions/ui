import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, importHTML, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { toggle } from './toggle.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(toggle());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// standardKit supplies the paragraph codec so the toggle's children serialize.
const registry = createCodecRegistry([toggle(), standardKit()]);

const toggleDoc = (open = true): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'toggle',
      attrs: { open },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Section body' }],
        },
      ],
    },
  ],
});

describe('toggle', () => {
  it('inserts a toggle via its command', () => {
    const editor = build();
    expect(editor.run('insertToggle')).not.toBe(false);
    const node = editor.getJSON().content?.find((n) => n.type === 'toggle');
    expect(node?.type).toBe('toggle');
    expect(node?.attrs?.open).toBe(true);
  });

  it('round-trips through HTML using <details> semantics', () => {
    const html = serialize(toggleDoc(true), 'html', registry);
    expect(html).toContain('<details');
    expect(html).toContain('open');
    expect(html).toContain('Section body');
  });

  it('omits the open attribute for a collapsed toggle', () => {
    const html = serialize(toggleDoc(false), 'html', registry);
    expect(html).toContain('<details>');
    expect(html).not.toContain('open');
  });

  it('exports a raw <details> block to Markdown', () => {
    const md = serialize(toggleDoc(true), 'markdown', registry);
    expect(md).toContain('<details');
    expect(md).toContain('Section body');
  });

  it('imports a <details open> element back into an open toggle', () => {
    const result = importHTML('<details open><p>Hi</p></details>', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('toggle');
    expect(node?.attrs?.open).toBe(true);
    const text = node?.content?.[0]?.content?.[0]?.text;
    expect(text).toBe('Hi');
  });

  it('imports a plain <details> element as a collapsed toggle', () => {
    const result = importHTML('<details><p>Hi</p></details>', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('toggle');
    expect(node?.attrs?.open).toBe(false);
  });
});
