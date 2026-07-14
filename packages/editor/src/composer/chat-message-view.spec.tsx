import { act, render, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IEditor } from '../document/core/index.js';
import type { ChatMessagePayload } from './composer-types.js';
import { ChatInput } from './chat-input.js';
import { ChatMessageView } from './chat-message-view.js';

afterEach(cleanup);

describe('ChatMessageView', () => {
  it('renders the SAME mention pill as ChatInput — one shared render path', async () => {
    // Input side: insert a mention and read the pill the node-view renders.
    let editor!: IEditor;
    const input = render(
      <ChatInput onSubmit={vi.fn()} onReady={(e) => (editor = e)} />,
    );
    await waitFor(() => expect(editor).toBeDefined());
    await waitFor(() =>
      expect(input.container.querySelector('.ProseMirror')).not.toBeNull(),
    );
    act(() => {
      editor.focus();
      editor.run('insertMention', { id: 'u1', label: 'Ada' });
    });
    const inputPill = await waitFor(() => {
      const el = input.container.querySelector('[data-slot="mention"]');
      if (!el) throw new Error('input pill not mounted');
      return el;
    });

    // View side: the same mention in a submitted payload.
    const message: ChatMessagePayload = {
      command: null,
      mentions: [{ id: 'u1', label: 'Ada' }],
      segments: [{ mention: { id: 'u1', label: 'Ada' } }],
    };
    const view = render(<ChatMessageView message={message} />);
    const viewPill = view.container.querySelector('[data-slot="mention"]');

    // Same `MentionPill` → identical token classes, id data, and label text.
    expect(viewPill).not.toBeNull();
    expect(viewPill!.className).toBe(inputPill.className);
    expect(viewPill!.getAttribute('data-mention-id')).toBe(
      inputPill.getAttribute('data-mention-id'),
    );
    expect(viewPill!.textContent).toBe(inputPill.textContent);
    expect(viewPill!.textContent).toBe('@Ada');
  });

  it('renders the label, never the raw id', () => {
    const { getByText, queryByText } = render(
      <ChatMessageView
        message={{
          command: null,
          mentions: [{ id: 'u1', label: 'Ada' }],
          segments: [{ mention: { id: 'u1', label: 'Ada' } }],
        }}
      />,
    );
    expect(getByText('@Ada')).toBeDefined();
    expect(queryByText('u1')).toBeNull();
  });

  it('renders the leading command as an inline `/name` pill (not a badge)', () => {
    const { container, getByText, queryByText } = render(
      <ChatMessageView
        message={{
          command: { id: 'image', label: 'Image', name: 'image-gen' },
          mentions: [],
          segments: [
            { command: { id: 'image', label: 'Image', name: 'image-gen' } },
            { text: 'a portrait' },
          ],
        }}
      />,
    );
    const pill = container.querySelector('[data-slot="command"]');
    expect(pill).not.toBeNull();
    expect(pill!.getAttribute('data-command-id')).toBe('image');
    // The pill reads `/name` (the invocation slug), inline — never the label
    // in a separate secondary badge.
    expect(pill!.textContent).toBe('/image-gen');
    expect(getByText('a portrait')).toBeDefined();
    expect(queryByText('Image')).toBeNull();
  });

  it('renders no command pill when the message carries no command', () => {
    const { container } = render(
      <ChatMessageView
        message={{ command: null, mentions: [], segments: [{ text: 'hello' }] }}
      />,
    );
    expect(container.querySelector('.chat-composer')).not.toBeNull();
    expect(container.querySelector('[data-slot="command"]')).toBeNull();
  });
});
