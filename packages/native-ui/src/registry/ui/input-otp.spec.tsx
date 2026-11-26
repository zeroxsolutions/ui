import { fireEvent, isHiddenFromAccessibility, render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ReactElement } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS_AND_CHARS } from './input-otp';

// The slots are hidden from screen readers, which the default queries skip.
const HIDDEN = { includeHiddenElements: true } as const;

type RenderedNode = ReturnType<typeof screen.getByTestId>;

/** Whether the slot draws the caret: a view of its own where a typed character would be. */
function holdsCaret(slot: RenderedNode): boolean {
  return slot.children.some((child) => typeof child !== 'string' && child.type === 'View');
}

function sixDigitCode(props: Partial<Parameters<typeof InputOTP>[0]> = {}): ReactElement {
  return (
    <InputOTP maxLength={6} aria-label="Verification code" {...props}>
      <InputOTPGroup testID="first-group">
        <InputOTPSlot index={0} testID="slot-0" />
        <InputOTPSlot index={1} testID="slot-1" />
        <InputOTPSlot index={2} testID="slot-2" />
      </InputOTPGroup>
      <InputOTPSeparator testID="separator" />
      <InputOTPGroup>
        <InputOTPSlot index={3} testID="slot-3" />
        <InputOTPSlot index={4} testID="slot-4" />
        <InputOTPSlot index={5} testID="slot-5" />
      </InputOTPGroup>
    </InputOTP>
  );
}

describe('InputOTP', () => {
  it('is one text field for the whole code, which the OS offers a texted code to', async () => {
    await render(sixDigitCode());

    const field = screen.getByLabelText('Verification code');
    expect(field.props).toEqual(
      expect.objectContaining({ keyboardType: 'number-pad', textContentType: 'oneTimeCode', autoComplete: 'sms-otp' }),
    );
    expect(isHiddenFromAccessibility(screen.getByTestId('slot-0', HIDDEN))).toBe(true);
    expect(isHiddenFromAccessibility(screen.getByTestId('separator', HIDDEN))).toBe(true);
  });

  it('shows each typed character in its slot and reports the code', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ onChange }));

    await userEvent.setup().type(screen.getByLabelText('Verification code'), '12');

    expect(screen.getByText('1', HIDDEN)).toBeOnTheScreen();
    expect(screen.getByText('2', HIDDEN)).toBeOnTheScreen();
    expect(onChange).toHaveBeenLastCalledWith('12');
  });

  it('fills every slot from one paste of the code, spaces removed, and reports it complete', async () => {
    const onComplete = jest.fn();
    await render(sixDigitCode({ onComplete }));

    await userEvent.setup().paste(screen.getByLabelText('Verification code'), '123 456');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
    expect(['1', '2', '3', '4', '5', '6'].map((char) => screen.getByText(char, HIDDEN))).toHaveLength(6);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('replaces a partly filled code with the pasted one, from the simulated OS write of the old code and the paste', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ defaultValue: '12', onChange }));

    // The caret sits at the end of the code, so the OS reports a paste as the old code with the new text after it.
    await fireEvent.changeText(screen.getByLabelText('Verification code'), '12123456');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
    expect(onChange).toHaveBeenLastCalledWith('123456');
  });

  it('takes an autofill of the whole code over a partly filled one as the code', async () => {
    await render(sixDigitCode({ defaultValue: '12' }));

    await userEvent.setup().paste(screen.getByLabelText('Verification code'), '123456');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
  });

  it('appends a short paste that still fits the code, from the simulated OS write of the old code and the paste', async () => {
    await render(sixDigitCode({ defaultValue: '12' }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '1234');

    expect(screen.getByLabelText('Verification code').props.value).toBe('1234');
  });

  it('leaves the code and reports no change when every pasted character is refused, from the simulated OS write', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ defaultValue: '12', onChange }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '12abc');

    expect(screen.getByLabelText('Verification code').props.value).toBe('12');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a paste with a character the pattern rejects, whatever its length, from the simulated OS write', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ defaultValue: '12', onChange }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '12abcdefgh');

    expect(screen.getByLabelText('Verification code').props.value).toBe('12');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('tests the whole code against a pattern with the global flag every time', async () => {
    await render(sixDigitCode({ pattern: /^\d+$/g }));
    const field = screen.getByLabelText('Verification code');

    await userEvent.setup().type(field, '1234');

    expect(field.props.value).toBe('1234');
  });

  it('lets a pattern that wants six digits take the code only once it is whole', async () => {
    await render(sixDigitCode({ pattern: '^\\d{6}$' }));
    const field = screen.getByLabelText('Verification code');

    await userEvent.setup().type(field, '123');
    expect(field.props.value).toBe('');

    await userEvent.setup().paste(field, '123456');
    expect(field.props.value).toBe('123456');
  });

  it('completes once when typed in full', async () => {
    const onComplete = jest.fn();
    await render(sixDigitCode({ onComplete }));

    await userEvent.setup().type(screen.getByLabelText('Verification code'), '123456');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('keeps no more characters than the code has from a paste', async () => {
    await render(sixDigitCode());

    await userEvent.setup().paste(screen.getByLabelText('Verification code'), '12345678');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
  });

  it('ignores a keystroke on a full code, reporting no change and no second completion', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await render(sixDigitCode({ defaultValue: '123456', onChange, onComplete }));

    await userEvent.setup().type(screen.getByLabelText('Verification code'), '7');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
    expect(onChange).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('refuses a character outside the code alphabet, digits by default', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ onChange }));
    const field = screen.getByLabelText('Verification code');

    await userEvent.setup().type(field, '1a');

    expect(field.props.value).toBe('1');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('takes letters under a pattern that allows them', async () => {
    await render(sixDigitCode({ pattern: REGEXP_ONLY_DIGITS_AND_CHARS, keyboardType: 'default' }));

    await userEvent.setup().type(screen.getByLabelText('Verification code'), 'a1B');

    expect(screen.getByLabelText('Verification code').props.value).toBe('a1B');
  });

  it('stays hidden under the slots whatever style a caller gives the field', async () => {
    await render(sixDigitCode({ style: { opacity: 1, color: 'black' } }));

    const style = StyleSheet.flatten(screen.getByLabelText('Verification code').props.style);
    expect(style.opacity).toBeLessThan(0.05);
    expect(style.color).toBe('transparent');
  });

  it('shows the value a caller controls', async () => {
    await render(sixDigitCode({ value: '42' }));

    expect(screen.getByText('4', HIDDEN)).toBeOnTheScreen();
    expect(screen.getByLabelText('Verification code').props.value).toBe('42');
  });

  it('puts a caret on the next empty slot while it holds focus, and none once it lets focus go', async () => {
    const user = userEvent.setup();
    await render(sixDigitCode({ defaultValue: '12' }));
    const field = screen.getByLabelText('Verification code');

    expect(holdsCaret(screen.getByTestId('slot-2', HIDDEN))).toBe(false);

    await user.type(field, '3', { skipBlur: true });

    expect(holdsCaret(screen.getByTestId('slot-3', HIDDEN))).toBe(true);
    expect(holdsCaret(screen.getByTestId('slot-2', HIDDEN))).toBe(false);

    await user.type(field, '4');

    expect(['slot-4', 'slot-5'].filter((slot) => holdsCaret(screen.getByTestId(slot, HIDDEN)))).toEqual([]);
  });

  it('passes aria-invalid on to the field', async () => {
    await render(sixDigitCode({ 'aria-invalid': true }));

    expect(screen.getByLabelText('Verification code')).toHaveProp('aria-invalid', true);
  });

  it('takes no typing and is announced disabled when editable is false', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ editable: false, onChange }));
    const field = screen.getByLabelText('Verification code');

    await userEvent.setup().type(field, '1');

    expect(onChange).not.toHaveBeenCalled();
    expect(field).toBeDisabled();
  });

  // The field's style is fixed when the module loads, so each platform loads its own copy of the
  // component, React Native and the renderer.
  it.each(['ios', 'android'] as const)(
    'stays visible to the screen reader and autofill on %s, its text and underline invisible',
    async (os) => {
      jest.resetModules();
      require('react-native').Platform.OS = os;
      const fresh: typeof import('./input-otp') = require('./input-otp');
      // The pure entry registers no cleanup hooks, which a test body may not add.
      const testing: typeof import('@testing-library/react-native') = require('@testing-library/react-native/pure');

      try {
        await testing.render(
          <fresh.InputOTP maxLength={6} aria-label="Verification code">
            <fresh.InputOTPGroup>
              <fresh.InputOTPSlot index={0} />
            </fresh.InputOTPGroup>
          </fresh.InputOTP>,
        );

        const field = testing.screen.getByLabelText('Verification code');
        const style = StyleSheet.flatten(field.props.style);
        expect(style.opacity).toBeGreaterThan(0);
        expect(style.color).toBe('transparent');
        expect(field.props.underlineColorAndroid).toBe('transparent');
      } finally {
        await testing.cleanup();
      }
    },
  );

  it('requires a label for the field, as aria-label or accessibilityLabel', async () => {
    const children = <InputOTPGroup />;
    const labelled = (
      <>
        <InputOTP maxLength={4} aria-label="Code">
          {children}
        </InputOTP>
        <InputOTP maxLength={4} accessibilityLabel="Other code">
          {children}
        </InputOTP>
      </>
    );
    // @ts-expect-error a field with no label is refused by type
    void (<InputOTP maxLength={4}>{children}</InputOTP>);

    await render(labelled);
    expect(screen.getByLabelText('Code')).toBeOnTheScreen();
    expect(screen.getByLabelText('Other code')).toBeOnTheScreen();
  });
});
