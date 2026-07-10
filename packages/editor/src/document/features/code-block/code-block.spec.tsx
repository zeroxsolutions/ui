import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../core/index.js';
import type { DocJSON, IEditor } from '../../core/index.js';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
} from '../../serialize/index.js';
import { standardKit } from '../standard/index.js';
import { codeBlock } from './code-block.js';

const editors: IEditor[] = [];
function build(): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor().use(standardKit()).use(codeBlock()).build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

const registry = createCodecRegistry([codeBlock()]);
const codeDoc: DocJSON = {
  type: 'doc',
  content: [{ type: 'codeBlock', attrs: { language: 'ts', code: 'const x = 1;' } }],
};

describe('codeBlock', () => {
  it('inserts a code block via insertCodeBlock', () => {
    const editor = build();
    editor.run('insertCodeBlock', { language: 'ts', code: 'const x = 1;' });
    const node = editor.getJSON().content?.find((n) => n.type === 'codeBlock');
    expect(node?.attrs?.language).toBe('ts');
    expect(node?.attrs?.code).toBe('const x = 1;');
  });

  it('exports a fenced Markdown code block', () => {
    const md = serialize(codeDoc, 'markdown', registry);
    expect(md).toContain('```ts');
    expect(md).toContain('const x = 1;');
  });

  it('exports an HTML code block with a language class', () => {
    const html = serialize(codeDoc, 'html', registry);
    expect(html).toContain('<pre><code class="language-ts">');
    expect(html).toContain('const x = 1;');
  });

  it('imports a fenced Markdown code block', () => {
    const result = importMarkdown('```ts\nconst x = 1;\n```', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('codeBlock');
    expect(node?.attrs?.language).toBe('ts');
    expect(node?.attrs?.code).toBe('const x = 1;');
  });
});
