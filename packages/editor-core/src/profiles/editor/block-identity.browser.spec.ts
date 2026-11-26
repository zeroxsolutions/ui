import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Editor } from '../../document/advanced.js';
import { blocks, callout, destroyMounted, keysAreUnique, mount, paragraph } from './block-identity.fixture.js';

afterEach(destroyMounted);

/** Puts the caret at `position` in the editor and gives it focus, as a reader's click does. */
function caretAt(engine: Editor, position: number): void {
  engine.commands.setTextSelection(position);
  engine.view.focus();
}

/** Selects the top-level block at `index` as a whole, focused, and copies it through the browser. */
async function copyBlock(engine: Editor, index = 0): Promise<void> {
  let position = 0;
  for (let child = 0; child < index; child += 1) position += engine.state.doc.child(child).nodeSize;
  engine.commands.setNodeSelection(position);
  engine.view.focus();
  await userEvent.copy();
}

describe('blockIdentity, driven from the keyboard and the clipboard', () => {
  it('keeps the id on the half that keeps the text when Enter splits a block', async () => {
    const atStart = mount([callout('note', { id: 'b', key: 'kb' })]);
    caretAt(atStart.engine, 1);
    await userEvent.keyboard('{Enter}');
    const [empty, kept] = blocks(atStart.editor);
    expect(atStart.engine.state.doc.child(0).textContent).toBe('');
    expect(empty.id).toBeNull();
    expect(empty.key).not.toBe('kb');
    expect(kept).toEqual({ type: 'callout', id: 'b', key: 'kb' });

    const plain = mount([paragraph('one', { id: 'a', key: 'ka' })]);
    caretAt(plain.engine, 1);
    await userEvent.keyboard('{Enter}');
    expect(blocks(plain.editor)[0].id).toBeNull();
    expect(blocks(plain.editor)[1]).toEqual({ type: 'paragraph', id: 'a', key: 'ka' });
    expect(keysAreUnique(plain.editor)).toBe(true);

    const inside = mount([callout('note', { id: 'b', key: 'kb' })]);
    caretAt(inside.engine, 3);
    await userEvent.keyboard('{Enter}');
    const [first, second] = blocks(inside.editor);
    expect(first).toEqual({ type: 'callout', id: 'b', key: 'kb' });
    expect(second.id).toBeNull();
    expect(keysAreUnique(inside.editor)).toBe(true);
  });

  it('gives a pasted copy of a block a null id and a new key, in a document opened with ids and no keys', async () => {
    const { editor, engine } = mount([callout('note', { id: 'b' }), paragraph('')]);
    const original = blocks(editor)[0];

    await copyBlock(engine);
    caretAt(engine, engine.state.doc.content.size - 1);
    await userEvent.paste();

    const callouts = blocks(editor).filter((block) => block.type === 'callout');
    expect(callouts).toHaveLength(2);
    expect(callouts[0]).toEqual(original);
    expect(callouts[1].id).toBeNull();
    expect(callouts[1].key).not.toBe(original.key);
    expect(keysAreUnique(editor)).toBe(true);
  });

  it('refuses a paste over a required block that would drop its id', async () => {
    const content = [paragraph('one', { id: 'a', key: 'ka' }), paragraph('two', { id: 'b', key: 'kb' })];
    const elsewhere = mount([paragraph('other')]);

    const unguarded = mount(content, { structure: () => 'locked' });
    await copyBlock(elsewhere.engine);
    unguarded.engine.commands.setNodeSelection(0);
    unguarded.engine.view.focus();
    await userEvent.paste();
    expect(unguarded.editor.getText()).toContain('other');

    const { editor, engine } = mount(content, { structure: () => 'locked', required: () => ['a'] });
    const before = editor.getJSON();
    await copyBlock(elsewhere.engine);
    engine.commands.setNodeSelection(0);
    engine.view.focus();
    await userEvent.paste();
    expect(editor.getJSON()).toEqual(before);
  });

  describe('locked structure', () => {
    const content = [
      paragraph('one', { id: 'a', key: 'ka' }),
      callout('note', { id: 'b', key: 'kb' }),
      paragraph('two', { id: 'c', key: 'kc' }),
    ];
    const keys: Array<[string, (engine: Editor) => number, string]> = [
      ['an Enter that splits a block', () => 3, '{Enter}'],
      ['a Backspace that joins two blocks', (engine) => engine.state.doc.content.size - 4, '{Backspace}'],
    ];

    it.each(keys)('refuses %s, which a free structure allows', async (_, caret, key) => {
      const free = mount(content);
      caretAt(free.engine, caret(free.engine));
      const freeBefore = free.editor.getJSON();
      await userEvent.keyboard(key);
      expect(free.editor.getJSON()).not.toEqual(freeBefore);

      const { editor, engine } = mount(content, { structure: () => 'locked' });
      caretAt(engine, caret(engine));
      const before = editor.getJSON();
      await userEvent.keyboard(key);
      expect(editor.getJSON()).toEqual(before);
    });
  });
});
