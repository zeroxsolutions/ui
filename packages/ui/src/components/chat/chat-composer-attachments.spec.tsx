import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatComposerAttachments } from './chat-composer-attachments';
import type { ChatAttachmentLike } from './chat-types';

afterEach(cleanup);

const attachments: ChatAttachmentLike[] = [
  {
    id: 'a1',
    name: 'hero.png',
    kind: 'image',
    dataUrl: 'data:image/png;base64,AAAA',
  },
  { id: 'a2', name: 'notes.txt', kind: 'text' },
];

describe('ChatComposerAttachments', () => {
  it('renders nothing when there are no attachments', () => {
    const { container } = render(
      <ChatComposerAttachments attachments={[]} onRemove={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders an image as a thumbnail and a non-image as a file chip', () => {
    render(
      <ChatComposerAttachments attachments={attachments} onRemove={vi.fn()} />,
    );
    expect((screen.getByAltText('hero.png') as HTMLImageElement).src).toContain(
      'data:image/png',
    );
    expect(screen.queryByAltText('notes.txt')).toBeNull();
    expect(screen.getByText('notes.txt')).toBeTruthy();
  });

  it('forwards removal of a specific chip by id', () => {
    const onRemove = vi.fn();
    render(
      <ChatComposerAttachments attachments={attachments} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove notes.txt' }));
    expect(onRemove).toHaveBeenCalledWith('a2');
  });
});
