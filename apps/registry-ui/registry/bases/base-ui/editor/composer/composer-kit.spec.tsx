import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type {
  DocJSON,
  IEditor,
  NodeJSON,
} from '@zeroxsolutions/editor-core/document/core/index';
import { mention } from '../document/features/mention/index.js';
import { COMPOSER_TOP_CONTENT, composerKit } from './composer-kit.js';

const editors: IEditor[] = [];
function build(): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createEditor()
    .topContent(COMPOSER_TOP_CONTENT)
    .use(composerKit())
    .use(mention())
    .build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

/** Depth-first search for the first node of a type. */
function findNode(node: NodeJSON, type: string): NodeJSON | undefined {
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const found = findNode(child, type);
    if (found) return found;
  }
  return undefined;
}

describe('composerKit', () => {
  it('builds a single-textblock editor carrying the composer + mention features', () => {
    const editor = build();
    expect(editor.status).toBe('ready');
    expect(editor.hasFeature('composer')).toBe(true);
    expect(editor.hasFeature('mention')).toBe(true);
    const json = editor.getJSON();
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    expect(json.content?.[0]?.type).toBe('paragraph');
  });

  it('inserts an inline mention atom into the single block', () => {
    const editor = build();
    editor.run('focus', { position: 'end' });
    expect(editor.run('insertMention', { id: 'u1', label: 'Ada' })).not.toBe(
      false,
    );
    const node = findNode(editor.getJSON() as NodeJSON, 'mention');
    expect(node?.attrs?.id).toBe('u1');
    expect(node?.attrs?.label).toBe('Ada');
  });

  it('never grows past one top-level block (structural single line)', () => {
    const editor = build();
    editor.run('focus', { position: 'end' });
    editor.run('insertContent', { content: 'hello' });
    editor.run('insertContent', {
      content: {
        type: 'paragraph',
        content: [{ type: 'text', text: 'world' }],
      },
    });
    expect((editor.getJSON() as DocJSON).content).toHaveLength(1);
  });
});
