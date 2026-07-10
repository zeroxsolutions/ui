import { describe, expect, it } from 'vitest';
import { Mark } from './advanced.js';
import { createEditor } from './core/index.js';
import type { DocJSON } from './core/index.js';

const doc: DocJSON = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
};

describe('advanced engine escape', () => {
  it('registers a raw engine extension supplied via a feature', () => {
    // A raw Tiptap mark the declarative API is deliberately not used for.
    const Underline = Mark.create({
      name: 'underline',
      parseHTML: () => [{ tag: 'u' }],
      renderHTML: () => ['u', 0],
    });

    const element = document.createElement('div');
    document.body.append(element);
    const editor = createEditor()
      .use({ id: 'raw', advanced: { engineExtensions: [Underline] } })
      .content(doc)
      .build({ element });

    editor.run('selectAll');
    expect(editor.run('toggleMark', { name: 'underline' })).toBe(true);
    expect(editor.isActive('underline')).toBe(true);
    editor.destroy();
  });
});
