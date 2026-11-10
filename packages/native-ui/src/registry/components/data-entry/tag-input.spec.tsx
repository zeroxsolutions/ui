import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { TagInput, TagInputInput, TagInputList, TagInputTag, TagInputTagRemove, type TagInputProps } from './tag-input';

/** The editor as its demo composes it, holding its tags so each change shows. */
function Tags({ value: initial, onValueChange, ...props }: TagInputProps) {
  const [tags, setTags] = useState(initial);
  return (
    <TagInput
      value={tags}
      onValueChange={(next) => {
        onValueChange(next);
        setTags(next);
      }}
      {...props}
    >
      <TagInputList>
        {tags.map((tag) => (
          <TagInputTag key={tag} value={tag}>
            {tag}
            <TagInputTagRemove aria-label={`Remove ${tag}`} />
          </TagInputTag>
        ))}
      </TagInputList>
      <TagInputInput aria-label="Add a tag" placeholder="Add a tag" />
    </TagInput>
  );
}

/** The tags the editor shows, in order, read off their labels, the only text it draws. */
function shownTags(): string[] {
  return screen.queryAllByText(/.+/).map((label) => String(label.props.children));
}

describe('TagInput', () => {
  it('adds the trimmed draft on the return key, empties the field and keeps it focused', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Add a tag'), '  ui  ', { submitEditing: true, skipBlur: true });

    expect(onValueChange.mock.calls).toEqual([[['design', 'ui']]]);
    expect(screen.getByText('ui')).toBeOnTheScreen();
    expect(screen.getByLabelText('Add a tag')).toHaveDisplayValue('');
    expect(screen.getByLabelText('Add a tag').props.submitBehavior).toBe('submit');
  });

  it('adds the draft when a comma is typed, leaving no comma in the field', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Add a tag'), 'ui,', { skipBlur: true });

    expect(onValueChange.mock.calls).toEqual([[['design', 'ui']]]);
    expect(screen.getByLabelText('Add a tag')).toHaveDisplayValue('');
  });

  it('adds each tag of a pasted list split by commas, keeping the text after the last as the draft', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await user.paste(screen.getByLabelText('Add a tag'), 'ui, docs,  , design, web');

    expect(onValueChange.mock.calls).toEqual([[['design', 'ui', 'docs']], [['design', 'ui', 'docs', 'web']]]);
    expect(shownTags()).toEqual(['design', 'ui', 'docs', 'web']);
  });

  it('adds the draft when the field is left', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Add a tag'), 'ui');

    expect(onValueChange.mock.calls).toEqual([[['design', 'ui']]]);
    expect(screen.getByLabelText('Add a tag')).toHaveDisplayValue('');
  });

  it('adds no tag the list holds already, and none that is only spaces', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Add a tag'), ' design ', { submitEditing: true, skipBlur: true });
    await user.type(screen.getByLabelText('Add a tag'), '   ,');
    await user.type(screen.getByLabelText('Add a tag'), '   ');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(shownTags()).toEqual(['design']);
  });

  it('removes the last tag on Backspace in an empty field, and none while the field holds a draft', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design', 'ui']} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Add a tag'), 'x{Backspace}', { skipBlur: true });
    expect(onValueChange).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Add a tag'), '{Backspace}', { skipBlur: true });
    expect(onValueChange.mock.calls).toEqual([[['design']]]);
    expect(shownTags()).toEqual(['design']);
  });

  it('removes a tag when its remove button is pressed', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design', 'ui', 'docs']} onValueChange={onValueChange} />);

    await user.press(screen.getByRole('button', { name: 'Remove ui' }));

    expect(onValueChange.mock.calls).toEqual([[['design', 'docs']]]);
    expect(shownTags()).toEqual(['design', 'docs']);
  });

  it("runs the caller's onPress beside the removal", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const onValueChange = jest.fn();
    await render(
      <TagInput value={['design']} onValueChange={onValueChange}>
        <TagInputTag value="design">
          design
          <TagInputTagRemove aria-label="Remove design" onPress={onPress} />
        </TagInputTag>
      </TagInput>,
    );

    await user.press(screen.getByRole('button', { name: 'Remove design' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls).toEqual([[[]]]);
  });

  it("runs the caller's handlers on the field beside its own", async () => {
    const user = userEvent.setup();
    const onSubmitEditing = jest.fn();
    const onChangeText = jest.fn();
    const onKeyPress = jest.fn();
    const onBlur = jest.fn();
    const onValueChange = jest.fn();
    await render(
      <TagInput value={[]} onValueChange={onValueChange}>
        <TagInputInput
          aria-label="Add a tag"
          onSubmitEditing={onSubmitEditing}
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          onBlur={onBlur}
        />
      </TagInput>,
    );

    await user.type(screen.getByLabelText('Add a tag'), 'ui', { submitEditing: true });

    expect(onChangeText).toHaveBeenLastCalledWith('ui');
    expect(onKeyPress).toHaveBeenCalledTimes(2);
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls).toEqual([[['ui']]]);
  });

  it('announces the field and every remove button disabled while disabled, and takes no edit', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Tags value={['design']} disabled onValueChange={onValueChange} />);

    expect(screen.getByLabelText('Add a tag')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove design' })).toBeDisabled();

    await user.type(screen.getByLabelText('Add a tag'), 'ui');
    await user.press(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('throws when a part is rendered outside TagInput, and the remove button outside a tag', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<TagInputInput aria-label="Add a tag" />)).rejects.toThrow(
      'TagInput parts must be used within <TagInput>',
    );
    await expect(
      render(
        <TagInput value={[]} onValueChange={() => undefined}>
          <TagInputTagRemove aria-label="Remove" />
        </TagInput>,
      ),
    ).rejects.toThrow('TagInputTagRemove must be used within <TagInputTag>');
  });
});
