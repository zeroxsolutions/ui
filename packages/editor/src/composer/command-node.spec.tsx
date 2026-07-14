import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../document/core/index.js';
import type { DocJSON, IEditor, NodeJSON } from '../document/core/index.js';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '../document/serialize/index.js';
import { standardKit } from '../document/features/standard/index.js';
import { slashCommand } from './command-node.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(slashCommand());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// The doc/paragraph substrate codecs are seeded by createCodecRegistry, so the
// surrounding paragraph serializes without standardKit here.
const registry = createCodecRegistry([slashCommand()]);

/** Depth-first search for the first node of a type — command is inline, so it
 *  lives nested inside a paragraph rather than at the document root. */
function findNode(node: NodeJSON, type: string): NodeJSON | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

const commandDoc = (
  id = 'image',
  name = 'image-gen',
  label = 'Image',
): DocJSON => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'command', attrs: { id, label, name } }],
    },
  ],
});

describe('slashCommand', () => {
  it('inserts an inline command via its command', () => {
    const editor = build();
    expect(
      editor.run('insertCommand', {
        id: 'image',
        label: 'Image',
        name: 'image-gen',
      }),
    ).not.toBe(false);
    const node = findNode(editor.getJSON(), 'command');
    expect(node?.attrs?.id).toBe('image');
    expect(node?.attrs?.name).toBe('image-gen');
    expect(node?.attrs?.label).toBe('Image');
  });

  it('rejects an insert missing the required id/name', () => {
    const editor = build();
    // `id`/`name` are required — invalid args reject at the dispatch boundary
    // (throws) without mutating the document.
    expect(() => editor.run('insertCommand', { label: 'Image' })).toThrow();
    expect(findNode(editor.getJSON(), 'command')).toBeUndefined();
  });

  it('exports HTML carrying the command id, name, and /slug text', () => {
    const html = serialize(commandDoc(), 'html', registry);
    expect(html).toContain('data-command-id="image"');
    expect(html).toContain('data-command-name="image-gen"');
    expect(html).toContain('/image-gen');
  });

  it('exports the honest /slug text to Markdown', () => {
    const md = serialize(commandDoc(), 'markdown', registry);
    expect(md).toContain('/image-gen');
  });

  it('imports a data-command-id span back into a command node', () => {
    const result = importHTML(
      '<p><span data-command-id="code" data-command-name="code" data-command-label="Code">/code</span></p>',
      registry,
    );
    const node = findNode(result.doc, 'command');
    expect(node?.attrs?.id).toBe('code');
    expect(node?.attrs?.name).toBe('code');
    expect(node?.attrs?.label).toBe('Code');
  });
});
