import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '../../core/index.js';
import type { DocJSON, IEditor, NodeJSON } from '../../core/index.js';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '../../serialize/index.js';
import { standardKit } from '../standard/index.js';
import { embed } from './embed.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(embed());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// The doc/paragraph substrate codecs are seeded by createCodecRegistry; the
// embed block carries its own codec, so no standardKit is needed here.
const registry = createCodecRegistry([embed()]);

/** Depth-first search for the first node of a type. */
function findNode(node: NodeJSON, type: string): NodeJSON | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

const embedDoc = (url = 'https://example.com', title = ''): DocJSON => ({
  type: 'doc',
  content: [{ type: 'embed', attrs: { url, title } }],
});

describe('embed', () => {
  it('inserts an embed via its command', () => {
    const editor = build();
    expect(editor.run('insertEmbed', { url: 'https://example.com' })).not.toBe(false);
    const node = findNode(editor.getJSON(), 'embed');
    expect(node?.type).toBe('embed');
    expect(node?.attrs?.url).toBe('https://example.com');
  });

  it('exports an iframe carrying the url to HTML', () => {
    const html = serialize(embedDoc('https://example.com'), 'html', registry);
    expect(html).toContain('<iframe');
    expect(html).toContain('https://example.com');
  });

  it('exports a link line carrying the url to Markdown', () => {
    const md = serialize(embedDoc('https://example.com', 'Example'), 'markdown', registry);
    expect(md).toContain('https://example.com');
    expect(md).toContain('[Example]');
  });

  it('imports a data-embed element back into an embed', () => {
    const result = importHTML(
      '<div data-embed data-url="https://example.com"><iframe src="https://example.com"></iframe></div>',
      registry,
    );
    const node = findNode(result.doc, 'embed');
    expect(node?.type).toBe('embed');
    expect(node?.attrs?.url).toBe('https://example.com');
  });
});
