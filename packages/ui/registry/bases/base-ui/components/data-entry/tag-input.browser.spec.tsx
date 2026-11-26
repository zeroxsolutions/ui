import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TagInput, TagInputInput, TagInputList, TagInputTag, TagInputTagRemove, type TagInputProps } from './tag-input';

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
  it('commits a trimmed tag on Enter via onValueChange', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await userEvent.type(page.getByPlaceholder('Add a tag'), '  ui  {Enter}');
    expect(onValueChange).toHaveBeenCalledWith(['design', 'ui']);
  });

  it('commits on a comma and on leaving the field, and never adds a duplicate', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    const input = page.getByPlaceholder('Add a tag');
    await userEvent.type(input, 'ui,');
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'ui']);

    await userEvent.type(input, 'design');
    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('commits what is typed as the field is left', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await userEvent.type(page.getByPlaceholder('Add a tag'), 'ui');
    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledWith(['design', 'ui']);
  });

  it('drops the last tag on Backspace when the input is empty', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    await userEvent.click(page.getByRole('textbox'));
    await userEvent.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenCalledWith(['design']);
  });

  it('removes a tag when its remove button is pressed', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    await userEvent.click(page.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenCalledWith(['ui']);
  });

  it('keeps a tag when its label is clicked', async () => {
    const onValueChange = vi.fn();
    await render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    await userEvent.click(page.getByText('design', { exact: true }));
    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(page.getByRole('button', { name: 'Remove design' })).toBeVisible();
  });

  it('disables the input and every remove button', async () => {
    await render(<Tags value={['design']} onValueChange={vi.fn()} disabled />);

    await expect.element(page.getByRole('button', { name: 'Remove design' })).toBeDisabled();
    await expect.element(page.getByRole('textbox')).toBeDisabled();
  });

  it('passes the div props through, so its aria-label names the editor', async () => {
    await render(<Tags value={[]} onValueChange={vi.fn()} aria-label="Tags" />);

    await expect.element(page.getByLabelText('Tags', { exact: true })).toBeInTheDocument();
  });
});
