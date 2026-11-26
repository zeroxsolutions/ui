import { render, screen, userEvent } from '@testing-library/react-native';
import { Textarea } from './textarea.nativewind';

describe('Textarea', () => {
  it('is a multiline field that starts its text at the top', async () => {
    await render(<Textarea aria-label="Notes" />);

    expect(screen.getByLabelText('Notes')).toHaveProp('multiline', true);
    expect(screen.getByLabelText('Notes')).toHaveProp('textAlignVertical', 'top');
  });

  it("takes what is typed and still calls the caller's onFocus and onBlur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(<Textarea aria-label="Notes" onFocus={onFocus} onBlur={onBlur} onChangeText={onChangeText} />);

    await user.type(screen.getByLabelText('Notes'), 'ok');

    expect(onChangeText).toHaveBeenLastCalledWith('ok');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('passes aria-invalid on to the field', async () => {
    await render(<Textarea aria-label="Notes" aria-invalid />);

    expect(screen.getByLabelText('Notes')).toHaveProp('aria-invalid', true);
  });

  it('takes no typing when editable is false', async () => {
    const onChangeText = jest.fn();
    await render(<Textarea aria-label="Notes" editable={false} onChangeText={onChangeText} />);

    await userEvent.setup().type(screen.getByLabelText('Notes'), 'ok');

    expect(onChangeText).not.toHaveBeenCalled();
  });
});
