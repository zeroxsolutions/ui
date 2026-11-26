import { render, screen, userEvent } from '@testing-library/react-native';
import { Input } from './input.nativewind';

describe('Input', () => {
  it("takes what is typed and still calls the caller's onFocus and onBlur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(<Input aria-label="Email" onFocus={onFocus} onBlur={onBlur} onChangeText={onChangeText} />);

    await user.type(screen.getByLabelText('Email'), 'ada');

    expect(onChangeText).toHaveBeenLastCalledWith('ada');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('passes aria-invalid on to the field', async () => {
    await render(<Input aria-label="Email" aria-invalid />);

    expect(screen.getByLabelText('Email')).toHaveProp('aria-invalid', true);
  });

  it('takes no typing and is announced disabled when editable is false', async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    await render(<Input aria-label="Email" editable={false} onChangeText={onChangeText} />);

    await user.type(screen.getByLabelText('Email'), 'ada');

    expect(onChangeText).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });
});
