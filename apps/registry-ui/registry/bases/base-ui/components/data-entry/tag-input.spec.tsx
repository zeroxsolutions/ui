import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TagInput, TagInputInput, TagInputList, TagInputTag, TagInputTagRemove, type TagInputProps } from './tag-input';

afterEach(cleanup);

/** The editor as its demo composes it. */
function Tags(props: Omit<TagInputProps, 'children'>) {
  return (
    <TagInput {...props}>
      <TagInputList>
        {props.value.map((tag) => (
          <TagInputTag key={tag} value={tag}>
            {tag}
            <TagInputTagRemove aria-label={`Remove ${tag}`} />
          </TagInputTag>
        ))}
      </TagInputList>
      <TagInputInput placeholder="Add a tag" />
    </TagInput>
  );
}

describe('TagInput', () => {
  it('commits a trimmed tag on Enter via onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Tags value={['design']} onValueChange={onValueChange} />);

    const input = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(input, { target: { value: '  ui  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith(['design', 'ui']);
  });

  it('commits on a comma and on leaving the field, and never adds a duplicate', () => {
    const onValueChange = vi.fn();
    render(<Tags value={['design']} onValueChange={onValueChange} />);

    const input = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(input, { target: { value: 'ui' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'ui']);

    fireEvent.change(input, { target: { value: 'design' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('drops the last tag on Backspace when the input is empty', () => {
    const onValueChange = vi.fn();
    render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onValueChange).toHaveBeenCalledWith(['design']);
  });

  it('removes a tag when its remove button is pressed', () => {
    const onValueChange = vi.fn();
    render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenCalledWith(['ui']);
  });

  it('keeps a tag when its label is clicked', () => {
    const onValueChange = vi.fn();
    render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByText('design'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remove design' })).toBeTruthy();
  });

  it('disables the input and every remove button, and marks itself disabled', () => {
    const onValueChange = vi.fn();
    const { container } = render(<Tags value={['design']} onValueChange={onValueChange} disabled />);

    const remove = screen.getByRole('button', { name: 'Remove design' }) as HTMLButtonElement;
    expect(remove.disabled).toBe(true);
    fireEvent.click(remove);
    expect(onValueChange).not.toHaveBeenCalled();
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    expect((container.firstElementChild as HTMLElement).hasAttribute('data-disabled')).toBe(true);
  });

  it('passes the div props through to the root', () => {
    const { container } = render(<Tags value={[]} onValueChange={vi.fn()} id="tags" aria-label="Tags" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.id).toBe('tags');
    expect(root.getAttribute('aria-label')).toBe('Tags');
  });
});
