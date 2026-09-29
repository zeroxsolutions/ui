import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TagInput } from './tag-input';

afterEach(cleanup);

describe('TagInput', () => {
  it('commits a trimmed tag on Enter via onValueChange', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={['design']} onValueChange={onValueChange} placeholder="Add a tag" />);

    const input = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(input, { target: { value: '  ui  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith(['design', 'ui']);
  });

  it('drops the last tag on Backspace when the input is empty', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={['design', 'ui']} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onValueChange).toHaveBeenCalledWith(['design']);
  });

  it('removes a tag when its chip × is clicked', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={['design', 'ui']} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenCalledWith(['ui']);
  });

  it('stamps its data-slot and passes the div props through to the root', () => {
    const { container } = render(<TagInput value={[]} onValueChange={vi.fn()} id="tags" aria-label="Tags" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('data-slot')).toBe('tag-input');
    expect(root.id).toBe('tags');
    expect(root.getAttribute('aria-label')).toBe('Tags');
  });
});
