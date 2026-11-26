import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { Editor } from '../../document/advanced.js';
import {
  caretIn,
  destroyMounted,
  mount,
  paragraph,
  sectionBelowTop,
  sectionHolders,
  sectionInSection,
  walk,
} from './block-layout.fixture.js';

afterEach(destroyMounted);

/**
 * Puts `html` on the clipboard as another app would leave it, and pastes it at the editor's caret. A
 * selection copied off this page instead reaches the clipboard with Chromium's computed styles, so a
 * named colour would arrive as `rgb(...)`. The clipboard takes a write only from a focused document.
 */
async function pasteHtml(engine: Editor, html: string): Promise<void> {
  engine.view.focus();
  const item = new ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' }),
  });
  await navigator.clipboard.write([item]);
  await userEvent.paste();
}

/** Copies the first top-level block of another editor, selected as a whole. */
async function copyFirstBlock(engine: Editor): Promise<void> {
  engine.commands.setNodeSelection(0);
  engine.view.focus();
  await userEvent.copy();
}

/** Pastes the clipboard at the caret, with the editor focused. */
async function pasteInto(engine: Editor): Promise<void> {
  engine.view.focus();
  await userEvent.paste();
}

describe('blockLayout, pasted through the clipboard', () => {
  it('maps pasted inline styles onto tokens, or drops them', async () => {
    const { editor, engine } = mount([paragraph('')]);

    // Whole paragraphs around it, since a lone pasted paragraph merges into the one the caret is in.
    engine.commands.setTextSelection(1);
    await pasteHtml(
      engine,
      '<p>a</p><p style="color:#ff0000;text-align:right;width:300px;background:rgb(1,2,3)">Hi</p><p>b</p>',
    );
    const pasted = walk(editor.getJSON().content ?? []).map(({ node }) => node);
    expect(pasted.find((node) => node.content?.[0]?.text === 'Hi')?.attrs).toMatchObject({ textAlign: 'end' });
    expect(pasted.flatMap((node) => node.marks ?? [])).toEqual([]);

    caretIn(engine, 'b');
    await pasteHtml(engine, '<p><span style="color:red">x</span><span style="background:teal">y</span></p>');
    const marks = walk(editor.getJSON().content ?? []).flatMap(({ node }) => node.marks ?? []);
    expect(marks).toEqual(
      expect.arrayContaining([
        { type: 'textColor', attrs: { token: 'red' } },
        { type: 'textBackground', attrs: { token: 'teal' } },
      ]),
    );
    const json = JSON.stringify(editor.getJSON());
    expect(json).not.toMatch(/\d+px/);
    expect(json).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it('keeps a section pasted into a section at the top of the document', async () => {
    const { editor, engine } = mount([{ type: 'section', content: [paragraph('in')] }]);

    await copyFirstBlock(mount([{ type: 'section', content: [paragraph('copied')] }]).engine);
    engine.commands.setTextSelection(2);
    await pasteInto(engine);

    expect(sectionInSection(editor.getJSON())).toBe(false);
    expect(walk(editor.getJSON().content ?? []).some(({ node }) => node.text?.includes('copied'))).toBe(true);
  });

  it.each(Object.entries(sectionHolders))('unwraps a section pasted into a %s', async (_, holder) => {
    const { editor, engine } = mount([holder([paragraph('inner')])]);

    await copyFirstBlock(mount([{ type: 'section', content: [paragraph('copied')] }]).engine);
    caretIn(engine, 'inner');
    await pasteInto(engine);

    expect(sectionBelowTop(editor.getJSON())).toBe(false);
    expect(walk(editor.getJSON().content ?? []).some(({ node }) => node.text?.includes('copied'))).toBe(true);
  });
});
