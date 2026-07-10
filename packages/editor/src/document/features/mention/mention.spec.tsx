import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../core/index.js';
import type { DocJSON, IEditor, NodeJSON } from '../../core/index.js';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '../../serialize/index.js';
import { standardKit } from '../standard/index.js';
import { mention } from './mention.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(mention());
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
const registry = createCodecRegistry([mention()]);

/** Depth-first search for the first node of a type — mention is inline, so it
 *  lives nested inside a paragraph rather than at the document root. */
function findNode(node: NodeJSON, type: string): NodeJSON | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

const mentionDoc = (id = 'u1', label = 'Ada'): DocJSON => ({
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'mention', attrs: { id, label } }] },
  ],
});

describe('mention', () => {
  it('inserts an inline mention via its command', () => {
    const editor = build();
    expect(editor.run('insertMention', { id: 'u1', label: 'Ada' })).not.toBe(false);
    const node = findNode(editor.getJSON(), 'mention');
    expect(node?.attrs?.id).toBe('u1');
    expect(node?.attrs?.label).toBe('Ada');
  });

  it('rejects an insert missing the required identity', () => {
    const editor = build();
    // `id` is required — invalid args reject at the dispatch boundary (throws)
    // without mutating the document.
    expect(() => editor.run('insertMention', { label: 'Ada' })).toThrow();
    expect(findNode(editor.getJSON(), 'mention')).toBeUndefined();
  });

  it('exports HTML carrying the mention id and @label', () => {
    const html = serialize(mentionDoc('u1', 'Ada'), 'html', registry);
    expect(html).toContain('data-mention-id="u1"');
    expect(html).toContain('@Ada');
  });

  it('exports the honest-but-lossy @label to Markdown', () => {
    const md = serialize(mentionDoc('u1', 'Ada'), 'markdown', registry);
    expect(md).toContain('@Ada');
  });

  it('imports a data-mention-id span back into a mention', () => {
    const result = importHTML(
      '<p><span data-mention-id="u2">@Bob</span></p>',
      registry,
    );
    const node = findNode(result.doc, 'mention');
    expect(node?.attrs?.id).toBe('u2');
    expect(node?.attrs?.label).toBe('Bob');
  });
});
