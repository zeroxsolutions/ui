import { NodeSelection } from '@tiptap/pm/state';
import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';
import type { Editor } from '../../advanced.js';
import { createDocumentEditor } from '../create-document-editor.js';
import type { EditorFeature, IEditor, NodeJSON } from '../types/index.js';

const note: EditorFeature = {
  id: 'note',
  nodes: [
    {
      name: 'note',
      group: 'block',
      content: 'inline*',
      attrs: z.object({ id: z.string().nullable().default(null), key: z.string().nullable().default(null) }),
    },
  ],
};

function noteBlock(text: string, id: string, key: string): NodeJSON {
  return { type: 'note', attrs: { id, key }, content: [{ type: 'text', text }] };
}

const mounted: IEditor[] = [];
afterEach(() => {
  for (const editor of mounted.splice(0)) editor.destroy();
});

/** Mounts the document and selects its block at `index` as a whole, as the grip does. */
function mountSelecting(content: NodeJSON[], index: number): IEditor {
  let engine: Editor | undefined;
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    features: [note],
    content: { type: 'doc', content },
    element,
    onEngine: (raw) => {
      engine = raw as Editor;
    },
  });
  mounted.push(editor);
  const { doc, tr } = engine!.state;
  let pos = 0;
  for (let at = 0; at < index; at += 1) pos += doc.child(at).nodeSize;
  engine!.view.dispatch(tr.setSelection(NodeSelection.create(doc, pos)));
  return editor;
}

const blocksOf = (editor: IEditor) =>
  (editor.getJSON().content ?? []).map((block) => ({
    text: block.content?.[0]?.text,
    attrs: block.attrs as { id: string | null; key: string | null },
  }));

describe('duplicateBlock', () => {
  it('puts a copy below the selected block with its id null', () => {
    const editor = mountSelecting([noteBlock('a', 'host-a', 'k-a'), noteBlock('b', 'host-b', 'k-b')], 0);
    expect(editor.run('duplicateBlock')).toBe(true);
    const blocks = blocksOf(editor);
    expect(blocks.map((block) => block.text)).toEqual(['a', 'a', 'b']);
    expect(blocks[0].attrs.id).toBe('host-a');
    expect(blocks[1].attrs.id).toBeNull();
  });
});

describe('deleteBlock', () => {
  it('removes the selected block only', () => {
    const editor = mountSelecting([noteBlock('a', 'host-a', 'k-a'), noteBlock('b', 'host-b', 'k-b')], 1);
    expect(editor.run('deleteBlock')).toBe(true);
    expect(blocksOf(editor).map((block) => block.text)).toEqual(['a']);
  });
});
