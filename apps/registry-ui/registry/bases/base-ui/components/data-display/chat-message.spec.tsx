import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

import { ChatMessage } from './chat-message';

afterEach(cleanup);

const root = (): HTMLElement => document.querySelector('[data-slot="chat-message"]') as HTMLElement;

describe('ChatMessage', () => {
  it('renders the upstream message parts it is given', () => {
    render(
      <ChatMessage>
        <MessageContent>
          <MessageHeader>Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>answer</BubbleContent>
          </Bubble>
        </MessageContent>
      </ChatMessage>,
    );
    expect(screen.getByText('Assistant').getAttribute('data-slot')).toBe('message-header');
    expect(screen.getByText('answer').getAttribute('data-slot')).toBe('bubble-content');
  });

  it('aligns through the upstream message root', () => {
    render(<ChatMessage align="end">hello</ChatMessage>);
    expect(root().getAttribute('data-align')).toBe('end');
  });

  it('marks the root only while the message is streaming', () => {
    const { rerender } = render(<ChatMessage streaming>body</ChatMessage>);
    expect(root().hasAttribute('data-streaming')).toBe(true);

    rerender(<ChatMessage>body</ChatMessage>);
    expect(root().hasAttribute('data-streaming')).toBe(false);
  });

  it('draws the streaming line only while the message is streaming', () => {
    const { rerender } = render(<ChatMessage streaming>body</ChatMessage>);
    expect(root().querySelector('[data-slot="chat-message-accent"]')).not.toBeNull();

    rerender(<ChatMessage>body</ChatMessage>);
    expect(root().querySelector('[data-slot="chat-message-accent"]')).toBeNull();
  });

  it('paints the streaming line in the accent colour it is given', () => {
    render(
      <ChatMessage streaming accentColor="rgb(255, 0, 0)">
        body
      </ChatMessage>,
    );
    const accent = root().querySelector<HTMLElement>('[data-slot="chat-message-accent"]');
    expect(accent?.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('passes the caller style through to the row', () => {
    render(<ChatMessage style={{ maxWidth: '40rem' }}>body</ChatMessage>);
    expect(root().style.maxWidth).toBe('40rem');
  });
});
