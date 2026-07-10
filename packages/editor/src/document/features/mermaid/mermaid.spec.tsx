import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../core/index.js';
import type { DocJSON, IEditor } from '../../core/index.js';
import {
  createCodecRegistry,
  importMarkdown,
  serialize,
} from '../../serialize/index.js';
import { standardKit } from '../standard/index.js';
import { mermaid } from './mermaid.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(mermaid());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// mermaid is registered before standard so it claims the ```mermaid code fence
// before the generic code-block codec.
const registry = createCodecRegistry([mermaid(), standardKit()]);

const SOURCE = 'graph TD;\n  A-->B;';

describe('mermaid', () => {
  it('inserts a mermaid node with the given source via its command', () => {
    const editor = build();
    expect(editor.run('insertMermaid', { source: SOURCE })).not.toBe(false);
    const node = editor.getJSON().content?.find((n) => n.type === 'mermaid');
    expect(node?.type).toBe('mermaid');
    expect(node?.attrs?.source).toBe(SOURCE);
  });

  it('exports a mermaid node as a ```mermaid fenced block with the source', () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ type: 'mermaid', attrs: { source: SOURCE } }],
    };
    const md = serialize(doc, 'markdown', registry);
    expect(md).toContain('```mermaid');
    expect(md).toContain(SOURCE);
  });

  it('imports a ```mermaid fenced block back into a mermaid node', () => {
    const result = importMarkdown('```mermaid\ngraph TD;A-->B;\n```', registry);
    const node = result.doc.content?.[0];
    expect(node?.type).toBe('mermaid');
    expect(node?.attrs?.source).toBe('graph TD;A-->B;');
  });
});
