import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChatMessage } from './chat-message';

afterEach(cleanup);

describe('ChatMessage', () => {
  it('renders a user message as a right-pinned bubble', () => {
    const { container } = render(
      <ChatMessage role="user">hello</ChatMessage>,
    );
    const root = container.querySelector('[data-role="user"]');
    expect(root).toBeTruthy();
    expect(root?.className).toContain('ml-auto');
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders an assistant message full-width', () => {
    const { container } = render(
      <ChatMessage role="assistant">answer</ChatMessage>,
    );
    const root = container.querySelector('[data-role="assistant"]');
    expect(root?.className).toContain('w-full');
    expect(screen.getByText('answer')).toBeTruthy();
  });

  it('stamps data-slot="chat-message" on the root', () => {
    const { container } = render(
      <ChatMessage role="assistant">answer</ChatMessage>,
    );
    expect(
      container.querySelector('[data-slot="chat-message"]'),
    ).toBeTruthy();
  });

  it('shows the agent identity row only when showAgentLabel is set', () => {
    const { rerender } = render(
      <ChatMessage role="assistant" agent={{ name: 'Vincent' }}>
        body
      </ChatMessage>,
    );
    // No label without showAgentLabel.
    expect(screen.queryByText('Vincent')).toBeNull();

    rerender(
      <ChatMessage role="assistant" agent={{ name: 'Vincent' }} showAgentLabel>
        body
      </ChatMessage>,
    );
    expect(screen.getByText('Vincent')).toBeTruthy();
  });

  it('renders the agent icon in place of the colour dot when provided', () => {
    const Mark = ({ className }: { className?: string }) => (
      <svg data-testid="agent_mark" className={className} />
    );
    const { container } = render(
      <ChatMessage
        role="assistant"
        agent={{ name: 'Claude', icon: Mark }}
        showAgentLabel
      >
        body
      </ChatMessage>,
    );
    expect(screen.getByTestId('agent_mark')).toBeTruthy();
    // The colour dot (the only aria-hidden node) is gone when an icon is present.
    expect(container.querySelector('[aria-hidden]')).toBeNull();
  });

  it('paints a streaming accent in the agent colour', () => {
    const { container } = render(
      <ChatMessage role="assistant" agent={{ color: '#ff0000' }} streaming>
        body
      </ChatMessage>,
    );
    const accented = container.querySelector(
      '[style*="border-inline-start-color"]',
    );
    expect(accented).toBeTruthy();
  });

  it('ignores agent identity for user rows', () => {
    render(
      <ChatMessage role="user" agent={{ name: 'Vincent' }} showAgentLabel>
        hi
      </ChatMessage>,
    );
    expect(screen.queryByText('Vincent')).toBeNull();
  });
});
