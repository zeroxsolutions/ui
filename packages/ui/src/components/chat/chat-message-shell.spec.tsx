import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChatMessageShell } from './chat-message-shell';

afterEach(cleanup);

describe('ChatMessageShell', () => {
  it('renders a user message as a right-pinned bubble', () => {
    const { container } = render(
      <ChatMessageShell role="user">hello</ChatMessageShell>,
    );
    const root = container.querySelector('[data-role="user"]');
    expect(root).toBeTruthy();
    expect(root?.className).toContain('ml-auto');
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders an assistant message full-width', () => {
    const { container } = render(
      <ChatMessageShell role="assistant">answer</ChatMessageShell>,
    );
    const root = container.querySelector('[data-role="assistant"]');
    expect(root?.className).toContain('w-full');
    expect(screen.getByText('answer')).toBeTruthy();
  });

  it('shows the agent identity row only when showAgentLabel is set', () => {
    const { rerender } = render(
      <ChatMessageShell role="assistant" agent={{ name: 'Vincent' }}>
        body
      </ChatMessageShell>,
    );
    // No label without showAgentLabel.
    expect(screen.queryByText('Vincent')).toBeNull();

    rerender(
      <ChatMessageShell role="assistant" agent={{ name: 'Vincent' }} showAgentLabel>
        body
      </ChatMessageShell>,
    );
    expect(screen.getByText('Vincent')).toBeTruthy();
  });

  it('renders the agent icon in place of the colour dot when provided', () => {
    const Mark = ({ className }: { className?: string }) => (
      <svg data-testid="agent-mark" className={className} />
    );
    const { container } = render(
      <ChatMessageShell
        role="assistant"
        agent={{ name: 'Claude', icon: Mark }}
        showAgentLabel
      >
        body
      </ChatMessageShell>,
    );
    expect(screen.getByTestId('agent-mark')).toBeTruthy();
    // The colour dot (the only aria-hidden node) is gone when an icon is present.
    expect(container.querySelector('[aria-hidden]')).toBeNull();
  });

  it('paints a streaming accent in the agent colour', () => {
    const { container } = render(
      <ChatMessageShell role="assistant" agent={{ color: '#ff0000' }} streaming>
        body
      </ChatMessageShell>,
    );
    const accented = container.querySelector(
      '[style*="border-inline-start-color"]',
    );
    expect(accented).toBeTruthy();
  });

  it('ignores agent identity for user rows', () => {
    render(
      <ChatMessageShell role="user" agent={{ name: 'Vincent' }} showAgentLabel>
        hi
      </ChatMessageShell>,
    );
    expect(screen.queryByText('Vincent')).toBeNull();
  });
});
