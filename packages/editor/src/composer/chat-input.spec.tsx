import { act, render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IEditor } from '../document/core/index.js';
import type { ChatCommand } from './composer-types.js';
import { ChatInput } from './chat-input.js';

afterEach(cleanup);

const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image' },
  { id: 'video', name: 'video', label: 'Video' },
];

/** Mount `ChatInput`, capturing its façade via `onReady` so the test can drive
 *  real content (jsdom runs ProseMirror content ops fine; only caret geometry is
 *  unavailable, which the payload path never needs). */
async function mount(onSubmit = vi.fn()) {
  let editor!: IEditor;
  const utils = render(
    <ChatInput
      commands={commands}
      onSubmit={onSubmit}
      onReady={(e) => {
        editor = e;
      }}
    />,
  );
  await waitFor(() => expect(editor).toBeDefined());
  const control = utils.container.querySelector(
    '[data-slot="input-group-control"]',
  ) as HTMLElement;
  // Wait for `@tiptap/react` to adopt the view DOM, then focus the real
  // contenteditable — jsdom only reports focus (which the menus' open-state
  // reads) when the actual `.ProseMirror` element is focused.
  await waitFor(() =>
    expect(control.querySelector('.ProseMirror')).not.toBeNull(),
  );
  const pm = control.querySelector('.ProseMirror') as HTMLElement;
  act(() => {
    pm.focus();
    editor.focus();
  });
  return { ...utils, editor, control, pm, onSubmit };
}

describe('ChatInput', () => {
  it('submits positional segments + de-duped mentions with a null command, then clears', async () => {
    const { editor, control, onSubmit } = await mount();
    act(() => {
      editor.run('insertContent', { content: 'a portrait of ' });
      editor.run('insertMention', { id: 'u1', label: 'Ada' });
    });

    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith({
      command: null,
      mentions: [{ id: 'u1', label: 'Ada' }],
      segments: [
        { text: 'a portrait of ' },
        { mention: { id: 'u1', label: 'Ada' } },
      ],
    });
    // Cleared after submit.
    expect(editor.getText()).toBe('');
  });

  it('does not submit an empty message', async () => {
    const { control, onSubmit } = await mount();
    fireEvent.keyDown(control, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit on Shift+Enter (a newline, not a send)', async () => {
    const { editor, control, onSubmit } = await mount();
    act(() => {
      editor.run('insertContent', { content: 'hello' });
    });
    fireEvent.keyDown(control, { key: 'Enter', shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('commits the command as a leading inline node and carries it in the payload', async () => {
    const { editor, control, onSubmit } = await mount();
    // Type `/im` at the start so the command menu opens, then commit with Enter
    // (the menu owns Enter while open); the `/im` becomes an inline `/name` node.
    act(() => {
      editor.run('insertContent', { content: '/im' });
    });
    fireEvent.keyDown(document, { key: 'Enter' });

    // The committed pill leads the line; the argument text follows.
    act(() => {
      editor.run('insertContent', { content: 'a portrait of ' });
    });
    // The command is an inline node in the document, not surface state.
    expect(
      control.querySelector('[data-slot="command"]')?.textContent,
    ).toBe('/image-gen');

    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      command: { id: 'image', label: 'Image', name: 'image-gen' },
      segments: [
        { command: { id: 'image', label: 'Image', name: 'image-gen' } },
        { text: 'a portrait of ' },
      ],
    });
  });
});
