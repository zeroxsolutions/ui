import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatComposerAttachments } from './chat-composer-attachments';
import type { ChatAttachmentLike } from './chat-types';

afterEach(cleanup);

const attachments: ChatAttachmentLike[] = [
  { id: 'a1', name: 'one.txt', kind: 'text' },
  { id: 'a2', name: 'two.txt', kind: 'text' },
];

describe('ChatComposerAttachments', () => {
  it('renders nothing when there are no attachments', () => {
    const { container } = render(
      <ChatComposerAttachments attachments={[]} onRemove={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one chip per attachment', () => {
    render(
      <ChatComposerAttachments attachments={attachments} onRemove={vi.fn()} />,
    );
    expect(screen.getByText('one.txt')).toBeTruthy();
    expect(screen.getByText('two.txt')).toBeTruthy();
  });

  it('forwards removal of a specific chip by id', () => {
    const onRemove = vi.fn();
    render(
      <ChatComposerAttachments attachments={attachments} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove two.txt' }));
    expect(onRemove).toHaveBeenCalledWith('a2');
  });
});
