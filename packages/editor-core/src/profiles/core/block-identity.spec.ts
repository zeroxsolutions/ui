import { history, undo } from '@tiptap/pm/history';
import { afterEach, describe, expect, it } from 'vitest';
import type { Editor } from '../../document/advanced.js';
import { createDocumentEditor } from '../../document/core/create-document-editor.js';
import type { EditorFeature, IEditor, NodeJSON } from '../../document/core/types/index.js';
import { blockIdentity, type BlockIdentityOptions } from './block-identity.js';
import { emailNodeSpecs } from './email-nodes.js';

const email: EditorFeature = { id: 'email', nodes: emailNodeSpecs.nodes, marks: emailNodeSpecs.marks };

type Attrs = { id?: string | null; key?: string | null };

function paragraph(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'paragraph', attrs, content: text ? [{ type: 'text', text }] : [] };
}

function callout(text: string, attrs: Attrs = {}): NodeJSON {
  return { type: 'emailCallout', attrs, content: [{ type: 'text', text }] };
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

describe('blockIdentity', () => {
  it('gives every new block a key and a null id', () => {
    const { editor, engine } = mount([
      paragraph('one', { id: 'a', key: 'ka' }),
      callout('note', { id: 'b', key: 'kb' }),
    ]);

    engine.commands.setTextSelection(4);
    engine.commands.splitBlock();
    // Enter inside a callout splits it into two callouts carrying the same attributes.
    engine.commands.setTextSelection(10);
    engine.commands.splitBlock();
    editor.run('insertContent', { content: { type: 'paragraph', content: [{ type: 'text', text: 'new' }] } });

    const paragraphs = blocks(editor).filter((block) => block.type === 'paragraph');
    const callouts = blocks(editor).filter((block) => block.type === 'emailCallout');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(paragraphs.slice(1).every((block) => block.id === null)).toBe(true);
    expect(callouts).toHaveLength(2);
    expect(callouts[0]).toEqual({ type: 'emailCallout', id: 'b', key: 'kb' });
    expect(callouts[1].id).toBeNull();
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives a block the document opened without a key one on the first edit, keeping its id', () => {
    const { editor, engine } = mount([paragraph('one', { id: 'a' }), paragraph('two')]);

    engine.commands.setTextSelection(2);
    editor.run('insertContent', { content: 'x' });

    expect(blocks(editor).map((block) => block.id)).toEqual(['a', null]);
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('keeps id and key across a text edit and a move', () => {
    const { editor, engine } = mount([
      paragraph('one', { id: 'a', key: 'ka' }),
      paragraph('two', { id: 'b', key: 'kb' }),
    ]);

    engine.commands.setTextSelection(2);
    editor.run('insertContent', { content: 'x' });
    const second = engine.state.doc.child(1);
    const from = engine.state.doc.child(0).nodeSize;
    engine.view.dispatch(engine.state.tr.delete(from, from + second.nodeSize).insert(0, second));

    expect(blocks(editor)).toEqual([
      { type: 'paragraph', id: 'b', key: 'kb' },
      { type: 'paragraph', id: 'a', key: 'ka' },
    ]);
    expect(editor.getText()).toContain('oxne');
  });

  it('gives a pasted copy of a block a null id and a new key', () => {
    const { editor, engine } = mount([callout('note', { id: 'b', key: 'kb' }), paragraph('')]);
    const { dom } = engine.view.serializeForClipboard(engine.state.doc.slice(0, engine.state.doc.child(0).nodeSize));
    const copied = dom.innerHTML;
    expect(copied).toContain('kb');

    engine.commands.setTextSelection(engine.state.doc.content.size - 1);
    engine.view.pasteHTML(copied, new Event('paste') as ClipboardEvent);

    const callouts = blocks(editor).filter((block) => block.type === 'emailCallout');
    expect(callouts).toHaveLength(2);
    expect(callouts[0]).toEqual({ type: 'emailCallout', id: 'b', key: 'kb' });
    expect(callouts[1].id).toBeNull();
    expect(callouts[1].key).not.toBe('kb');
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('gives a duplicated block a null id and a new key, wherever the copy lands', () => {
    const { editor, engine } = mount([paragraph('one', { id: 'a', key: 'ka' })]);

    engine.view.dispatch(engine.state.tr.insert(0, engine.state.doc.child(0)));

    expect(blocks(editor)[0].id).toBeNull();
    expect(blocks(editor)[1]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('assignBlockIds sets ids without moving the selection or adding an undo step', () => {
    const history_: EditorFeature = { id: 'history', advanced: { prosePlugins: [history()] } };
    const { editor, engine } = mount([paragraph('one', { key: 'ka' }), paragraph('two', { key: 'kb' })], {}, [
      history_,
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

  it('refuses insert, delete, move, retype, attribute change and split in locked structure', () => {
    const { editor, engine } = mount(
      [
        paragraph('one', { id: 'a', key: 'ka' }),
        callout('note', { id: 'b', key: 'kb' }),
        paragraph('two', { id: 'c', key: 'kc' }),
      ],
      { structure: () => 'locked' },
    );

    engine.commands.setTextSelection(2);
    expect(editor.run('insertContent', { content: 'x' })).toBe(true);
    expect(editor.run('insertContent', { content: { type: 'variable', attrs: { name: 'first' } } })).toBe(true);
    engine.commands.setTextSelection({ from: 1, to: 3 });
    expect(editor.run('toggleMark', { name: 'bold' })).toBe(true);
    expect(editor.getText()).toContain('ox');
    const edited = editor.getJSON();
    expect(JSON.stringify(edited)).toContain('"variable"');
    expect(JSON.stringify(edited)).toContain('"bold"');

    const refused: Array<[string, () => void]> = [
      ['insert', () => editor.run('insertContent', { content: { type: 'emailDivider' } })],
      ['delete', () => editor.run('deleteBlock')],
      ['delete range', () => engine.view.dispatch(engine.state.tr.delete(0, engine.state.doc.child(0).nodeSize))],
      [
        'move',
        () => {
          const last = engine.state.doc.child(2);
          const from = engine.state.doc.content.size - last.nodeSize;
          engine.view.dispatch(engine.state.tr.delete(from, engine.state.doc.content.size).insert(0, last));
        },
      ],
      ['retype', () => editor.run('setNode', { name: 'emailCallout' })],
      [
        'attribute change',
        () => {
          engine.commands.setTextSelection(engine.state.doc.child(0).nodeSize + 2);
          editor.run('updateAttributes', { name: 'emailCallout', attrs: { align: 'center' } });
        },
      ],
      ['split', () => engine.commands.splitBlock()],
      ['enter', () => press(engine, 'Enter')],
    ];
    for (const [name, attempt] of refused) {
      engine.commands.setTextSelection(3);
      attempt();
      expect(editor.getJSON(), name).toEqual(edited);
    }
    expect(editor.can('deleteBlock')).toBe(false);
    expect(editor.run('assignBlockIds', { ids: { kc: 'z' } })).toBe(true);
    expect(blocks(editor)[2].id).toBe('z');
  });

  it('refuses a join in locked structure', () => {
    const content = [paragraph('one', { id: 'a', key: 'ka' }), paragraph('two', { id: 'b', key: 'kb' })];
    const free = mount(content);
    free.engine.commands.setTextSelection(6);
    press(free.engine, 'Backspace');
    expect(blocks(free.editor)).toHaveLength(1);

    const { editor, engine } = mount(content, { structure: () => 'locked' });
    const before = editor.getJSON();
    engine.commands.setTextSelection(6);
    press(engine, 'Backspace');
    expect(editor.getJSON()).toEqual(before);
  });
});
