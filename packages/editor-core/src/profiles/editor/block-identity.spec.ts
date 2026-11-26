import { history, undo } from '@tiptap/pm/history';
import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';
import type { Editor } from '../../document/advanced.js';
import { createDocumentEditor } from '../../document/core/create-document-editor.js';
import type { EditorFeature, IEditor, NodeJSON, NodeSpec } from '../../document/core/types/index.js';
import { blockIdentity, type BlockIdentityOptions } from './block-identity.js';
import { buttonNodeSpec, columnsNodeSpecs, emailNodeSpecs, sectionNodeSpecs } from '../core/email-nodes.js';

// Stand-ins for the document's own callout and rule, which live outside editor-core; the callout holds
// inline text here so a caret in it sits in the block itself.
const documentNodes: NodeSpec[] = [
  {
    name: 'callout',
    group: 'block',
    content: 'inline*',
    defining: true,
    attrs: z.object({ variant: z.string().optional(), align: z.string().optional() }),
  },
  { name: 'horizontalRule', group: 'block', atom: true },
];

const email: EditorFeature = {
  id: 'email',
  nodes: [...documentNodes, buttonNodeSpec, ...columnsNodeSpecs(), ...sectionNodeSpecs(), ...emailNodeSpecs.nodes],
  marks: [{ name: 'bold', htmlTag: 'strong' }, ...emailNodeSpecs.marks],
};
const undoable: EditorFeature = { id: 'history', advanced: { prosePlugins: [history()] } };

type Attrs = Record<string, unknown> & { id?: string | null; key?: string | null };

function paragraph(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'paragraph', attrs, content: text ? [{ type: 'text', text }] : [] };
}

function callout(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'callout', attrs, content: [{ type: 'text', text }] };
}

function button(attrs: Attrs): NodeJSON {
  return { type: 'button', attrs };
}

const mounted: IEditor[] = [];
afterEach(() => {
  for (const editor of mounted.splice(0)) editor.destroy();
});

function mount(content: NodeJSON[], options: BlockIdentityOptions = {}, extra: EditorFeature[] = []) {
  let engine: Editor | undefined;
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    features: [email, blockIdentity(options), ...extra],
    content: { type: 'doc', content },
    element,
    onEngine: (raw) => {
      engine = raw as Editor;
    },
  });
  mounted.push(editor);
  return { editor, engine: engine as Editor };
}

function blocks(editor: IEditor): Array<{ type: string; id: unknown; key: unknown }> {
  return (editor.getJSON().content ?? []).map((block) => ({
    type: block.type,
    id: (block.attrs as Attrs | undefined)?.id ?? null,
    key: (block.attrs as Attrs | undefined)?.key ?? null,
  }));
}

function keysAreUnique(editor: IEditor): boolean {
  const keys = blocks(editor).map((block) => block.key);
  return keys.every((key) => typeof key === 'string' && key.length > 0) && new Set(keys).size === keys.length;
}

function press(engine: Editor, key: string): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  engine.view.someProp('handleKeyDown', (handle) => handle(engine.view, event));
}

/** Copies the document's first `count` top-level blocks as the clipboard would carry them. */
function copyBlocks(engine: Editor, count = 1): string {
  let size = 0;
  for (let index = 0; index < count; index += 1) size += engine.state.doc.child(index).nodeSize;
  return engine.view.serializeForClipboard(engine.state.doc.slice(0, size)).dom.innerHTML;
}

function paste(engine: Editor, html: string): void {
  engine.view.pasteHTML(html, new Event('paste') as ClipboardEvent);
}

describe('blockIdentity', () => {
  it('keys every block the document opens with, keeping its ids', () => {
    const { editor } = mount([paragraph('one', { id: 'a' }), callout('note', { id: 'b' }), paragraph('two')]);

    expect(blocks(editor).map((block) => block.id)).toEqual(['a', 'b', null]);
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives every new block a key and a null id', () => {
    const { editor, engine } = mount([
      paragraph('one', { id: 'a', key: 'ka' }),
      callout('note', { id: 'b', key: 'kb' }),
    ]);

    engine.commands.setTextSelection(4);
    engine.commands.splitBlock();
    engine.commands.setTextSelection(10);
    engine.commands.splitBlock();
    editor.run('insertContent', { content: { type: 'paragraph', content: [{ type: 'text', text: 'new' }] } });

    const paragraphs = blocks(editor).filter((block) => block.type === 'paragraph');
    const callouts = blocks(editor).filter((block) => block.type === 'callout');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(paragraphs.slice(1).every((block) => block.id === null)).toBe(true);
    expect(callouts).toHaveLength(2);
    expect(callouts[0]).toEqual({ type: 'callout', id: 'b', key: 'kb' });
    expect(callouts[1].id).toBeNull();
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('keys the blocks a section holds, those it opens with and those added in it', () => {
    const { editor, engine } = mount([{ type: 'section', content: [paragraph('in', { id: 'a' })] }]);
    const inside = () =>
      (editor.getJSON().content?.[0]?.content ?? []).map((block) => (block.attrs as Attrs | undefined)?.key);

    expect(inside()).toHaveLength(1);
    engine.commands.setTextSelection(4);
    engine.commands.splitBlock();

    const keys = [blocks(editor)[0]?.key, ...inside()];
    expect(keys).toHaveLength(3);
    expect(keys.every((key) => typeof key === 'string' && key !== '')).toBe(true);
    expect(new Set(keys).size).toBe(3);
  });

  it('keeps the id on the half that keeps the text when Enter splits a block', () => {
    const atStart = mount([callout('note', { id: 'b', key: 'kb' })]);
    atStart.engine.commands.setTextSelection(1);
    press(atStart.engine, 'Enter');
    const [empty, kept] = blocks(atStart.editor);
    expect(atStart.engine.state.doc.child(0).textContent).toBe('');
    expect(empty.id).toBeNull();
    expect(empty.key).not.toBe('kb');
    expect(kept).toEqual({ type: 'callout', id: 'b', key: 'kb' });

    const plain = mount([paragraph('one', { id: 'a', key: 'ka' })]);
    plain.engine.commands.setTextSelection(1);
    press(plain.engine, 'Enter');
    expect(blocks(plain.editor)[0].id).toBeNull();
    expect(blocks(plain.editor)[1]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(keysAreUnique(plain.editor)).toBe(true);

    const command = mount([callout('note', { id: 'b', key: 'kb' })]);
    command.engine.commands.setTextSelection(1);
    command.engine.commands.splitBlock();
    expect(blocks(command.editor)[0].id).toBeNull();
    expect(blocks(command.editor)[1]).toEqual({ type: 'callout', id: 'b', key: 'kb' });

    const inside = mount([callout('note', { id: 'b', key: 'kb' })]);
    inside.engine.commands.setTextSelection(3);
    press(inside.engine, 'Enter');
    const [first, second] = blocks(inside.editor);
    expect(first).toEqual({ type: 'callout', id: 'b', key: 'kb' });
    expect(second.id).toBeNull();
    expect(keysAreUnique(inside.editor)).toBe(true);
  });

  it('keeps id and key across a text edit, a move and a retype', () => {
    const { editor, engine } = mount([
      paragraph('one', { id: 'a', key: 'ka' }),
      paragraph('two', { id: 'b', key: 'kb' }),
    ]);

    engine.commands.setTextSelection(2);
    editor.run('insertContent', { content: 'x' });
    const second = engine.state.doc.child(1);
    const from = engine.state.doc.child(0).nodeSize;
    engine.view.dispatch(engine.state.tr.delete(from, from + second.nodeSize).insert(0, second));
    engine.commands.setTextSelection(2);
    expect(editor.run('setNode', { name: 'callout' })).toBe(true);

    expect(blocks(editor)).toEqual([
      { type: 'callout', id: 'b', key: 'kb' },
      { type: 'paragraph', id: 'a', key: 'ka' },
    ]);
    expect(editor.getText()).toContain('oxne');
  });

  it('keeps id and key off the clipboard', () => {
    const { engine } = mount([callout('note', { id: 'b', key: 'kb' }), paragraph('one', { id: 'a', key: 'ka' })]);

    const copied = copyBlocks(engine, 2);
    expect(copied).not.toMatch(/\b(id|key)=/);
    expect(engine.getHTML()).not.toMatch(/\b(id|key)=/);
  });

  it('gives a pasted copy of a block a null id and a new key, in a document opened with ids and no keys', () => {
    const { editor, engine } = mount([callout('note', { id: 'b' }), paragraph('')]);
    const original = blocks(editor)[0];

    engine.commands.setTextSelection(engine.state.doc.content.size - 1);
    paste(engine, copyBlocks(engine));

    const callouts = blocks(editor).filter((block) => block.type === 'callout');
    expect(callouts).toHaveLength(2);
    expect(callouts[0]).toEqual(original);
    expect(callouts[0].id).toBe('b');
    expect(callouts[1].id).toBeNull();
    expect(callouts[1].key).not.toBe(original.key);
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives a duplicated block a null id and a new key, wherever the copy lands', () => {
    const { editor, engine } = mount([paragraph('one', { id: 'a', key: 'ka' })]);

    engine.view.dispatch(engine.state.tr.insert(0, engine.state.doc.child(0)));

    expect(blocks(editor)[0].id).toBeNull();
    expect(blocks(editor)[1]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives an inserted block a null id when another block holds its id', () => {
    const { editor, engine } = mount([paragraph('one', { id: 'a', key: 'ka' })]);

    engine.commands.setTextSelection(engine.state.doc.content.size);
    editor.run('insertContent', {
      content: { type: 'paragraph', attrs: { id: 'a' }, content: [{ type: 'text', text: 'c' }] },
    });
    editor.run('insertContent', {
      content: { type: 'paragraph', attrs: { id: 'n' }, content: [{ type: 'text', text: 'd' }] },
    });

    expect(blocks(editor).map((block) => block.id)).toEqual(['a', null, 'n']);
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives an inserted keyed block a null id when another block holds its id', () => {
    const { editor, engine } = mount([paragraph('one', { id: 'a', key: 'ka' })]);

    engine.commands.setTextSelection(engine.state.doc.content.size);
    editor.run('insertContent', { content: paragraph('c', { id: 'a', key: 'kz' }) });
    editor.run('insertContent', { content: paragraph('d', { id: 'n', key: 'ka' }) });

    expect(blocks(editor).map((block) => block.id)).toEqual(['a', null, null]);
    expect(blocks(editor)[0].key).toBe('ka');
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('assignBlockIds sets ids without moving the selection or adding an undo step', () => {
    const { editor, engine } = mount([paragraph('one', { key: 'ka' }), paragraph('two', { key: 'kb' })], {}, [
      undoable,
    ]);
    engine.commands.setTextSelection(7);
    editor.run('insertContent', { content: 'x' });
    const before = editor.getSelection();

    expect(editor.run('assignBlockIds', { ids: { ka: '1', kb: '2' } })).toBe(true);

    expect(editor.getSelection()).toEqual(before);
    expect(blocks(editor).map((block) => block.id)).toEqual(['1', '2']);
    undo(engine.state, engine.view.dispatch);
    expect(editor.getText()).not.toContain('x');
    expect(blocks(editor).map((block) => block.id)).toEqual(['1', '2']);
  });

  it('keys a block type it is given and lets the host assign its id', () => {
    const note: EditorFeature = { id: 'note', nodes: [{ name: 'note', group: 'block', content: 'inline*' }] };
    const { editor } = mount(
      [paragraph('one'), { type: 'note', content: [{ type: 'text', text: 'two' }] }],
      { types: ['note'] },
      [note],
    );

    expect(keysAreUnique(editor)).toBe(true);
    const key = blocks(editor)[1].key as string;
    expect(editor.run('assignBlockIds', { ids: { [key]: 'n1' } })).toBe(true);
    expect(blocks(editor)[1]).toEqual({ type: 'note', id: 'n1', key });
  });

  it('assignBlockIds refuses an id another block holds', () => {
    const { editor } = mount([paragraph('one', { id: 'a', key: 'ka' }), paragraph('two', { key: 'kb' })]);
    const before = editor.getJSON();

    expect(editor.run('assignBlockIds', { ids: { kb: 'a' } })).toBe(false);
    expect(editor.run('assignBlockIds', { ids: { ka: 'z', kb: 'z' } })).toBe(false);
    expect(editor.getJSON()).toEqual(before);
  });

  it('refuses deleting a required block', () => {
    const { editor, engine } = mount(
      [paragraph('one', { id: 'a', key: 'ka' }), paragraph('two', { id: 'b', key: 'kb' })],
      {
        required: () => ['a'],
      },
    );
    const before = editor.getJSON();

    engine.commands.setTextSelection(2);
    expect(editor.can('deleteBlock')).toBe(false);
    expect(editor.run('deleteBlock')).toBe(false);
    engine.view.dispatch(engine.state.tr.delete(0, engine.state.doc.child(0).nodeSize));
    engine.commands.selectAll();
    engine.commands.deleteSelection();
    expect(editor.getJSON()).toEqual(before);

    engine.commands.setTextSelection(7);
    expect(editor.can('deleteBlock')).toBe(true);
    expect(editor.run('deleteBlock')).toBe(true);
    expect(blocks(editor)).toEqual([{ type: 'paragraph', id: 'a', key: 'ka' }]);
  });

  it('refuses deleting a columns block holding a required block', () => {
    const columns: NodeJSON = {
      type: 'columns',
      attrs: { id: 'c', key: 'kc', ratio: [1, 1] },
      content: [
        { type: 'column', content: [paragraph('left', { id: 'l', key: 'kl' })] },
        { type: 'column', content: [paragraph('right', { id: 'r', key: 'kr' })] },
      ],
    };
    const { editor, engine } = mount([columns, paragraph('after', { id: 'p', key: 'kp' })], { required: () => ['l'] });

    engine.commands.setNodeSelection(0);
    expect(editor.can('deleteBlock')).toBe(false);
    expect(editor.run('deleteBlock')).toBe(false);
    // The caret in the right lane's paragraph: that block alone may go.
    engine.commands.setTextSelection(engine.state.doc.child(0).nodeSize - 4);
    expect(editor.can('deleteBlock')).toBe(true);
  });

  it('refuses a paste over a required block that would drop its id', () => {
    const elsewhere = mount([paragraph('other')]);
    const copied = copyBlocks(elsewhere.engine);
    const content = [paragraph('one', { id: 'a', key: 'ka' }), paragraph('two', { id: 'b', key: 'kb' })];

    const unguarded = mount(content, { structure: () => 'locked' });
    unguarded.engine.commands.setNodeSelection(0);
    paste(unguarded.engine, copied);
    expect(unguarded.editor.getText()).toContain('other');

    const { editor, engine } = mount(content, { structure: () => 'locked', required: () => ['a'] });
    const before = editor.getJSON();
    engine.commands.setNodeSelection(0);
    paste(engine, copied);
    expect(editor.getJSON()).toEqual(before);
  });

  describe('locked structure', () => {
    const content = [
      paragraph('one', { id: 'a', key: 'ka' }),
      callout('note', { id: 'b', key: 'kb' }),
      paragraph('two', { id: 'c', key: 'kc' }),
    ];
    const calloutCaret = (engine: Editor) => engine.state.doc.child(0).nodeSize + 2;
    const attempts: Array<[string, (editor: IEditor, engine: Editor) => void]> = [
      ['insert', (editor) => editor.run('insertContent', { content: { type: 'horizontalRule' } })],
      ['delete', (editor) => editor.run('deleteBlock')],
      [
        'delete a whole block',
        (editor, engine) => {
          engine.commands.setNodeSelection(0);
          editor.run('deleteSelection');
        },
      ],
      [
        'move',
        (_, engine) => {
          const last = engine.state.doc.child(2);
          const from = engine.state.doc.content.size - last.nodeSize;
          engine.view.dispatch(engine.state.tr.delete(from, engine.state.doc.content.size).insert(0, last));
        },
      ],
      ['retype', (editor) => editor.run('setNode', { name: 'callout' })],
      [
        'attribute change',
        (editor, engine) => {
          engine.commands.setTextSelection(calloutCaret(engine));
          editor.run('updateAttributes', { name: 'callout', attrs: { align: 'center' } });
        },
      ],
      ['split', (_, engine) => engine.commands.splitBlock()],
      ['enter', (_, engine) => press(engine, 'Enter')],
      [
        'join',
        (_, engine) => {
          engine.commands.setTextSelection(engine.state.doc.content.size - 4);
          press(engine, 'Backspace');
        },
      ],
    ];

    it.each(attempts)('refuses %s, which a free structure allows', (_, attempt) => {
      const free = mount(content);
      free.engine.commands.setTextSelection(3);
      const freeBefore = free.editor.getJSON();
      attempt(free.editor, free.engine);
      expect(free.editor.getJSON()).not.toEqual(freeBefore);

      const { editor, engine } = mount(content, { structure: () => 'locked' });
      engine.commands.setTextSelection(3);
      const before = editor.getJSON();
      attempt(editor, engine);
      expect(editor.getJSON()).toEqual(before);
    });

    it('lets text, variables, marks and host ids through', () => {
      const { editor, engine } = mount(content, { structure: () => 'locked' });

      engine.commands.setTextSelection(2);
      expect(editor.run('insertContent', { content: 'x' })).toBe(true);
      expect(editor.run('insertContent', { content: { type: 'variable', attrs: { name: 'first' } } })).toBe(true);
      engine.commands.setTextSelection({ from: 1, to: 3 });
      expect(editor.run('toggleMark', { name: 'bold' })).toBe(true);
      expect(editor.can('deleteBlock')).toBe(false);
      expect(editor.run('assignBlockIds', { ids: { kc: 'z' } })).toBe(true);

      const json = JSON.stringify(editor.getJSON());
      expect(editor.getText()).toContain('ox');
      expect(json).toContain('"variable"');
      expect(json).toContain('"bold"');
      expect(blocks(editor)[2].id).toBe('z');
    });

    it("lets a button's label change and refuses its href", () => {
      const { editor, engine } = mount([button({ id: 'a', key: 'ka', label: 'Go', href: '{{u}}' })], {
        structure: () => 'locked',
      });

      engine.commands.setNodeSelection(0);
      expect(editor.run('updateAttributes', { name: 'button', attrs: { label: 'Di' } })).toBe(true);
      expect(editor.getJSON().content?.[0].attrs).toMatchObject({ label: 'Di', href: '{{u}}' });
      editor.run('updateAttributes', { name: 'button', attrs: { href: '{{v}}' } });
      expect(editor.getJSON().content?.[0].attrs).toMatchObject({ label: 'Di', href: '{{u}}' });
    });
  });

  describe('a host content load', () => {
    const loaded = { type: 'doc' as const, content: [callout('loaded', { id: 'x' }), paragraph('more')] };

    it('passes locked structure and a required id, and keys the loaded blocks', () => {
      const { editor } = mount([paragraph('one', { id: 'a', key: 'ka' })], {
        structure: () => 'locked',
        required: () => ['a'],
      });

      editor.setContent(loaded);

      expect(blocks(editor).map((block) => [block.type, block.id])).toEqual([
        ['callout', 'x'],
        ['paragraph', null],
      ]);
      expect(keysAreUnique(editor)).toBe(true);
    });

    it('leaves an author setContent command guarded', () => {
      const { editor } = mount([paragraph('one', { id: 'a', key: 'ka' })], { structure: () => 'locked' });
      const before = editor.getJSON();

      editor.run('setContent', { content: loaded });

      expect(editor.getJSON()).toEqual(before);
    });

    it('is not undone by an undo right after it', () => {
      const { editor, engine } = mount([paragraph('one', { id: 'a', key: 'ka' })], {}, [undoable]);
      engine.commands.setTextSelection(2);
      editor.run('insertContent', { content: 'x' });

      editor.setContent(loaded);
      undo(engine.state, engine.view.dispatch);

      expect(editor.getText()).toContain('loaded');
      expect(editor.getText()).not.toContain('oxne');
    });
  });
});
