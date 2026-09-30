import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';

import { ChatMessage } from './chat-message';

afterEach(cleanup);

/** The line drawn beside the message while it streams; decorative, so hidden from assistive technology. */
const accentLine = (container: HTMLElement): HTMLElement | null =>
  container.firstElementChild?.querySelector<HTMLElement>(':scope > [aria-hidden="true"]') ?? null;

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
    expect(screen.getByText('Assistant')).toBeTruthy();
    expect(screen.getByText('answer')).toBeTruthy();
  });

  it('aligns through the upstream message root', () => {
    const { container } = render(<ChatMessage align="end">hello</ChatMessage>);
    expect(container.firstElementChild?.getAttribute('data-align')).toBe('end');
  });

  it('marks the root only while the message is streaming', () => {
    const { container, rerender } = render(<ChatMessage streaming>body</ChatMessage>);
    expect(container.firstElementChild?.hasAttribute('data-streaming')).toBe(true);

    rerender(<ChatMessage>body</ChatMessage>);
    expect(container.firstElementChild?.hasAttribute('data-streaming')).toBe(false);
  });

  it('draws the streaming line only while the message is streaming', () => {
    const { container, rerender } = render(<ChatMessage streaming>body</ChatMessage>);
    expect(accentLine(container)).not.toBeNull();

    rerender(<ChatMessage>body</ChatMessage>);
    expect(accentLine(container)).toBeNull();
  });

  it('paints the streaming line in the accent colour it is given', () => {
    const { container } = render(
      <ChatMessage streaming accentColor="rgb(255, 0, 0)">
        body
      </ChatMessage>,
    );
    expect(accentLine(container)?.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('passes the caller style through to the row', () => {
    const { container } = render(<ChatMessage style={{ maxWidth: '40rem' }}>body</ChatMessage>);
    expect((container.firstElementChild as HTMLElement).style.maxWidth).toBe('40rem');
  });
});
