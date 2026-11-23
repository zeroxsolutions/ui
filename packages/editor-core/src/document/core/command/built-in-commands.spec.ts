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

// Stands in for a mention: an inline atom whose `id` names the person it points at.
const person: EditorFeature = {
  id: 'person',
  nodes: [{ name: 'person', group: 'inline', atom: true, attrs: z.object({ id: z.string() }) }],
};

// Stand in for the document's lists and its image, so Turn into has a list item and a block of no text to act on.
const lists: EditorFeature = {
  id: 'lists',
  nodes: [
    { name: 'bulletList', group: 'block', content: 'listItem+' },
    { name: 'orderedList', group: 'block', content: 'listItem+' },
    { name: 'listItem', content: 'paragraph+' },
    { name: 'image', group: 'block', atom: true },
  ],
};

function noteBlock(text: string, id: string, key: string): NodeJSON {
  return { type: 'note', attrs: { id, key }, content: [{ type: 'text', text }] };
}

const mounted: IEditor[] = [];
afterEach(() => {
  for (const editor of mounted.splice(0)) editor.destroy();
});

/** Mounts the document and selects its block at `index` as a whole, as the grip does; with `item`, that block's
 *  child at `item`, as the grip beside a list item does. */
function mountSelecting(content: NodeJSON[], index: number, item?: number): IEditor {
  let engine: Editor | undefined;
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    features: [note, person, lists],
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
  if (item !== undefined) {
    pos += 1;
    for (let at = 0; at < item; at += 1) pos += doc.child(index).child(at).nodeSize;
  }
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

  it('keeps the id of a mention inside the copied block', () => {
    const block: NodeJSON = {
      type: 'note',
      attrs: { id: 'host-a', key: 'k-a' },
      content: [
        { type: 'text', text: 'hi ' },
        { type: 'person', attrs: { id: 'person-1' } },
      ],
    };
    const editor = mountSelecting([block], 0);
    expect(editor.run('duplicateBlock')).toBe(true);
    const copy = editor.getJSON().content?.[1];
    expect(copy?.attrs?.id).toBeNull();
    expect(copy?.content?.[1]).toMatchObject({ type: 'person', attrs: { id: 'person-1' } });
  });
});

describe('deleteBlock', () => {
  it('removes the selected block only', () => {
    const editor = mountSelecting([noteBlock('a', 'host-a', 'k-a'), noteBlock('b', 'host-b', 'k-b')], 1);
    expect(editor.run('deleteBlock')).toBe(true);
    expect(blocksOf(editor).map((block) => block.text)).toEqual(['a']);
  });
});

const paragraph = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const listOf = (type: string, ...texts: string[]): NodeJSON => ({
  type,
  content: texts.map((text) => ({ type: 'listItem', content: [paragraph(text)] })),
});

/** Each top-level block as its type and the text of its lines. */
const shapeOf = (editor: IEditor) =>
  (editor.getJSON().content ?? []).map((block) =>
    block.type === 'paragraph'
      ? `paragraph:${block.content?.[0]?.text}`
      : `${block.type}:${(block.content ?? []).map((item) => item.content?.[0]?.content?.[0]?.text).join(',')}`,
  );

describe('a list item selected on its own', () => {
  it('leaves its list as a paragraph between the items before and after it', () => {
    const editor = mountSelecting([listOf('bulletList', 'a', 'b', 'c')], 0, 1);
    expect(editor.run('turnBlockInto', { name: 'paragraph' })).toBe(true);
    expect(shapeOf(editor)).toEqual(['bulletList:a', 'paragraph:b', 'bulletList:c']);
  });

  it('moves into a list of the other type, the items around it staying where they are', () => {
    const editor = mountSelecting([listOf('bulletList', 'a', 'b', 'c')], 0, 2);
    expect(editor.run('turnBlockInto', { name: 'orderedList' })).toBe(true);
    expect(shapeOf(editor)).toEqual(['bulletList:a,b', 'orderedList:c']);
  });

  it('is deleted alone, the rest of its list kept', () => {
    const editor = mountSelecting([listOf('bulletList', 'a', 'b', 'c')], 0, 2);
    expect(editor.run('deleteBlock')).toBe(true);
    expect(shapeOf(editor)).toEqual(['bulletList:a,b']);
  });

  it('is duplicated inside its list', () => {
    const editor = mountSelecting([listOf('bulletList', 'a', 'b')], 0, 0);
    expect(editor.run('duplicateBlock')).toBe(true);
    expect(shapeOf(editor)).toEqual(['bulletList:a,a,b']);
  });
});

describe('turnBlockInto on a block of no text', () => {
  it('cannot run, so a menu leaves it out', () => {
    const editor = mountSelecting([{ type: 'image' }, paragraph('a')], 0);
    expect(editor.can('turnBlockInto', { name: 'paragraph' })).toBe(false);
    expect(editor.run('turnBlockInto', { name: 'paragraph' })).toBe(false);
    expect(shapeOf(editor)).toEqual(['image:', 'paragraph:a']);
  });
});
