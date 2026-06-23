import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatAttachmentChip } from './chat-attachment-chip';
import type { ChatAttachmentLike } from './chat-types';

afterEach(cleanup);

const image: ChatAttachmentLike = {
  id: 'a1',
  name: 'shot.png',
  kind: 'image',
  dataUrl: 'data:image/png;base64,AAAA',
};
const file: ChatAttachmentLike = { id: 'a2', name: 'notes.txt', kind: 'text' };

describe('ChatAttachmentChip', () => {
  it('renders an image kind as a thumbnail', () => {
    render(<ChatAttachmentChip attachment={image} onRemove={vi.fn()} />);
    const img = screen.getByAltText('shot.png') as HTMLImageElement;
    expect(img.src).toContain('data:image/png');
  });

  it('renders a non-image kind as a file chip with its name', () => {
    render(<ChatAttachmentChip attachment={file} onRemove={vi.fn()} />);
    expect(screen.queryByAltText('notes.txt')).toBeNull();
    expect(screen.getByText('notes.txt')).toBeTruthy();
  });

  it('reports removal with the attachment id', () => {
    const onRemove = vi.fn();
    render(<ChatAttachmentChip attachment={image} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove shot.png' }));
    expect(onRemove).toHaveBeenCalledWith('a1');
  });

  it('applies the compact size when asked', () => {
    const { container } = render(
      <ChatAttachmentChip attachment={file} onRemove={vi.fn()} compact />,
    );
    expect(container.firstElementChild?.className).toContain('size-10');
  });
});
