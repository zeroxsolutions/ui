import { render, screen, userEvent } from '@testing-library/react-native';
import { InputGroupAddon, InputGroupText } from '../../ui/input-group';
import { NumberField, NumberFieldInput, type NumberFieldInputProps, type NumberFieldProps } from './number-field';

// React Native's jest mock gives every TextInput one shared `blur` mock, so its calls carry over between tests.
afterEach(() => {
  jest.clearAllMocks();
});

/** The field as its demo composes it, a width with a label before and a unit after. */
function Field({ input, ...props }: Omit<NumberFieldProps, 'children'> & { input?: NumberFieldInputProps }) {
  return (
    <NumberField {...props}>
      <InputGroupAddon>
        <InputGroupText>W</InputGroupText>
      </InputGroupAddon>
      <NumberFieldInput aria-label="Width" {...input} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </NumberField>
  );
}

describe('NumberField', () => {
  it('commits an expression typed onto the value when the return key is pressed', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={100} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), ' + 8', { submitEditing: true, skipBlur: true });

    expect(onValueChange.mock.calls).toEqual([[108]]);
  });

  it('commits an expression when the field is left', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={4} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), '*3');

    expect(onValueChange.mock.calls).toEqual([[12]]);
  });

  it('commits once when the return key is followed by leaving the field', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={100} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), '+8', { submitEditing: true });

    expect(onValueChange.mock.calls).toEqual([[108]]);
  });

  it('clamps the committed value to max and to min', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={5} min={0} max={10} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), '0');
    await user.type(screen.getByLabelText('Width'), '-9');

    expect(onValueChange.mock.calls).toEqual([[10], [0]]);
  });

  it('commits nothing for a draft that is not a number', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={5} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), 'px');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Width')).toHaveDisplayValue('5');
  });

  it('parses the draft with parseRaw in place of arithmetic', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={0} parseRaw={() => 7} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Width'), 'anything');

    expect(onValueChange.mock.calls).toEqual([[7]]);
  });

  it('blanks the value and shows the placeholder while mixed, and commits what is typed', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={5} mixed onValueChange={onValueChange} input={{ placeholder: 'Mixed' }} />);

    const input = screen.getByLabelText('Width');
    expect(input).toHaveDisplayValue('');
    expect(screen.getByPlaceholderText('Mixed')).toBe(input);

    await user.type(input, '42');

    expect(onValueChange.mock.calls).toEqual([[42]]);
  });

  it('shows no placeholder while not mixed', async () => {
    await render(<Field value={5} onValueChange={() => undefined} input={{ placeholder: 'Mixed' }} />);

    expect(screen.queryByPlaceholderText('Mixed')).toBeNull();
    expect(screen.getByLabelText('Width')).toHaveDisplayValue('5');
  });

  it('shows displayText until focused, then an empty draft to type a number into', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={5} displayText="Hug" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Width');
    expect(input).toHaveDisplayValue('Hug');

    await user.type(input, '', { skipBlur: true });
    expect(input).toHaveDisplayValue('');

    await user.type(input, '24');
    expect(onValueChange.mock.calls).toEqual([[24]]);
  });

  it('opens a keyboard that has a minus sign and the operators', async () => {
    await render(<Field value={5} onValueChange={() => undefined} />);

    expect(screen.getByLabelText('Width').props.keyboardType).toBe('numbers-and-punctuation');
  });

  it('announces the field disabled and takes no typing while disabled', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Field value={5} disabled onValueChange={onValueChange} />);

    expect(screen.getByLabelText('Width')).toBeDisabled();

    await user.type(screen.getByLabelText('Width'), '0');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("runs the caller's handlers on the input beside its own", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onChangeText = jest.fn();
    const onSubmitEditing = jest.fn();
    await render(
      <Field value={1} onValueChange={onValueChange} input={{ onFocus, onBlur, onChangeText, onSubmitEditing }} />,
    );

    await user.type(screen.getByLabelText('Width'), '2', { submitEditing: true });

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onChangeText).toHaveBeenLastCalledWith('12');
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls).toEqual([[12]]);
  });

  it('draws the addons the caller composed around the input', async () => {
    await render(<Field value={5} onValueChange={() => undefined} />);

    expect(screen.getByText('W')).toBeOnTheScreen();
    expect(screen.getByText('px')).toBeOnTheScreen();
  });

  it('throws when the input is rendered outside NumberField', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<NumberFieldInput aria-label="Width" />)).rejects.toThrow(
      'NumberFieldInput must be used within <NumberField>',
    );
  });
});
