import { act, render, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import type { ChatMessagePayload } from '@zeroxsolutions/editor-core/composer/composer-types';
import { ChatInput } from './chat-input.js';
import { ChatMessageView } from './chat-message-view.js';

afterEach(cleanup);

const para = (...inline: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: inline }],
});

/** A payload for the view - it renders `doc`; `text`/`tokens` are unused here. */
const message = (doc: DocJSON): ChatMessagePayload => ({ text: '', tokens: {}, doc });

describe('ChatMessageView', () => {
  it('renders the SAME mention pill as ChatInput - one shared render path', async () => {
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

    // View side: the same mention in a submitted payload's doc.
    const view = render(
      <ChatMessageView
        message={message(para({ type: 'mention', attrs: { id: 'u1', label: 'Ada' } }))}
      />,
    );
    const viewPill = view.container.querySelector('[data-slot="mention"]');

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
        message={message(para({ type: 'mention', attrs: { id: 'u1', label: 'Ada' } }))}
      />,
    );
    expect(getByText('@Ada')).toBeDefined();
    expect(queryByText('u1')).toBeNull();
  });

  it('renders the leading command as an inline `/name` pill (not a badge)', () => {
    const { container, getByText, queryByText } = render(
      <ChatMessageView
        message={message(
          para(
            { type: 'command', attrs: { id: 'image', label: 'Image', slug: 'image-gen' } },
            { type: 'text', text: 'a portrait' },
          ),
        )}
      />,
    );
    const pill = container.querySelector('[data-slot="command"]');
    expect(pill).not.toBeNull();
    expect(pill!.getAttribute('data-token-id')).toBe('image');
    // The pill reads `/name` (the invocation slug), inline - never the label in
    // a separate secondary badge.
    expect(pill!.textContent).toBe('/image-gen');
    expect(getByText('a portrait')).toBeDefined();
    expect(queryByText('Image')).toBeNull();
  });

  it('renders no command pill when the message carries no command', () => {
    const { container } = render(
      <ChatMessageView message={message(para({ type: 'text', text: 'hello' }))} />,
    );
    expect(container.querySelector('.chat-composer')).not.toBeNull();
    expect(container.querySelector('[data-slot="command"]')).toBeNull();
  });
});
