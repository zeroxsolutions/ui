import {
  act,
  render,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { ChatCommand } from '@zeroxsolutions/editor-core/composer/composer-types';
import { commandTrigger, mentionTrigger } from './composer-triggers';
import { ChatInput } from './chat-input.js';

afterEach(cleanup);

const commands: ChatCommand[] = [
  { id: 'image', name: 'image-gen', label: 'Image' },
  { id: 'video', name: 'video', label: 'Video' },
];

/** Mount `ChatInput` on the shipped triggers, capturing its façade via `onReady`
 *  so the test can drive real content (jsdom runs ProseMirror content ops fine;
 *  only caret geometry is unavailable, which the payload path never needs). */
async function mount(onSubmit = vi.fn()) {
  let editor!: IEditor;
  // Stable across re-renders so the editor builds once.
  const triggers = [mentionTrigger(), commandTrigger(commands)];
  const utils = render(
    <ChatInput
      triggers={triggers}
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
  it('submits a registry-derived payload (typed tokens + flat text), then clears', async () => {
    const { editor, control, onSubmit } = await mount();
    act(() => {
      editor.run('insertContent', { content: 'a portrait of ' });
      editor.run('insertMention', { id: 'u1', label: 'Ada' });
    });

    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      text: 'a portrait of @Ada',
      tokens: { mention: [{ id: 'u1', label: 'Ada' }], command: [] },
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

  it('commits the command as a leading inline pill and buckets it in the payload', async () => {
    const { editor, control, onSubmit } = await mount();
    // Type `/im` at the start so the command menu opens, then commit with Enter
    // (the menu owns Enter while open); the `/im` becomes an inline `/name` node.
    act(() => {
      editor.run('insertContent', { content: '/im' });
    });
    fireEvent.keyDown(document, { key: 'Enter' });

    act(() => {
      editor.run('insertContent', { content: 'a portrait of ' });
    });
    // The command is an inline node in the document, not surface state.
    expect(control.querySelector('[data-slot="command"]')?.textContent).toBe(
      '/image-gen',
    );

    fireEvent.keyDown(control, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.tokens.command).toEqual([
      { id: 'image', label: 'Image', name: 'image-gen' },
    ]);
    expect(payload.text).toBe('/image-gen a portrait of ');
  });
});
