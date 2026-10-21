import { fireEvent, isHiddenFromAccessibility, render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ReactElement } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS_AND_CHARS } from './input-otp';

// The slots are hidden from screen readers, which the default queries skip.
const HIDDEN = { includeHiddenElements: true } as const;

type RenderedNode = ReturnType<typeof screen.getByTestId>;

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID, HIDDEN).props.className);
}

/** Whether the node, or a node inside it, draws the caret line. */
function holdsCaret(node: RenderedNode): boolean {
  if (emittedClasses(node.props.className).includes('w-px')) return true;
  return node.children.some((child) => typeof child !== 'string' && holdsCaret(child));
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

  it('replaces a partly filled code with the pasted one, not a concatenation', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ defaultValue: '12', onChange }));

    // The caret sits at the end of the code, so the OS reports a paste as the old code with the new text after it.
    await fireEvent.changeText(screen.getByLabelText('Verification code'), '12123456');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
    expect(onChange).toHaveBeenLastCalledWith('123456');
  });

  it('takes an autofill of the whole code over a partly filled one as the code', async () => {
    await render(sixDigitCode({ defaultValue: '12' }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '123456');

    expect(screen.getByLabelText('Verification code').props.value).toBe('123456');
  });

  it('appends a short paste that still fits the code', async () => {
    await render(sixDigitCode({ defaultValue: '12' }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '1234');

    expect(screen.getByLabelText('Verification code').props.value).toBe('1234');
  });

  it('leaves the code and reports no change when every pasted character is refused', async () => {
    const onChange = jest.fn();
    await render(sixDigitCode({ defaultValue: '12', onChange }));

    await fireEvent.changeText(screen.getByLabelText('Verification code'), '12abc');

    expect(screen.getByLabelText('Verification code').props.value).toBe('12');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a paste with a character the pattern rejects, whatever its length', async () => {
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

  it('draws the focus border and a caret on the next empty slot while it holds focus', async () => {
    await render(sixDigitCode({ defaultValue: '12' }));

    expect(holdsCaret(screen.getByTestId('slot-2', HIDDEN))).toBe(false);

    await fireEvent(screen.getByLabelText('Verification code'), 'focus');

    expect(classesOf('slot-2')).toContain('border-ring');
    expect(holdsCaret(screen.getByTestId('slot-2', HIDDEN))).toBe(true);
    expect(classesOf('slot-1')).not.toContain('border-ring');
    expect(holdsCaret(screen.getByTestId('slot-1', HIDDEN))).toBe(false);

    await fireEvent(screen.getByLabelText('Verification code'), 'blur');

    expect(holdsCaret(screen.getByTestId('slot-2', HIDDEN))).toBe(false);
  });

  it('keeps the last slot active without a caret once the code is full', async () => {
    await render(sixDigitCode({ defaultValue: '123456' }));

    await fireEvent(screen.getByLabelText('Verification code'), 'focus');

    expect(classesOf('slot-5')).toContain('border-ring');
    expect(holdsCaret(screen.getByTestId('slot-5', HIDDEN))).toBe(false);
  });

  it('draws every slot destructive and passes aria-invalid on to the field', async () => {
    await render(sixDigitCode({ 'aria-invalid': true }));

    expect(screen.getByLabelText('Verification code').props['aria-invalid']).toBe(true);
    expect(classesOf('slot-0')).toContain('border-destructive');
    expect(classesOf('slot-4')).toContain('border-destructive');
  });

  it("merges a slot's textClassName after the style's text classes so it wins", async () => {
    await render(
      <InputOTP maxLength={2} aria-label="Verification code" defaultValue="12">
        <InputOTPGroup>
          <InputOTPSlot index={0} textClassName="text-lg font-sans-semibold" />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>,
    );

    const styled = emittedClasses(screen.getByText('1', HIDDEN).props.className);
    expect(styled).toEqual(expect.arrayContaining(['text-lg', 'font-sans-semibold']));
    expect(styled).not.toContain('text-sm');
    expect(emittedClasses(screen.getByText('2', HIDDEN).props.className)).toContain('text-sm');
  });

  it('rounds and closes only the outer edges of each group', async () => {
    await render(sixDigitCode());

    expect(classesOf('slot-0')).toEqual(expect.arrayContaining(['rounded-l-md', 'border-l']));
    expect(classesOf('slot-1')).not.toContain('rounded-l-md');
    expect(classesOf('slot-2')).toContain('rounded-r-md');
    expect(classesOf('slot-3')).toContain('border-l');
  });

  it('is not editable, dimmed and announced disabled when editable is false', async () => {
    await render(sixDigitCode({ editable: false }));
    const field = screen.getByLabelText('Verification code');

    expect(field.props.editable).toBe(false);
    expect(field.props['aria-disabled']).toBe(true);
    expect(emittedClasses(field.parent?.props.className)).toContain('opacity-50');
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
    const unlabelled = (
      // @ts-expect-error a field with no label is refused by type
      <InputOTP maxLength={4}>{children}</InputOTP>
    );

    await render(labelled);
    expect(screen.getByLabelText('Code')).toBeOnTheScreen();
    expect(screen.getByLabelText('Other code')).toBeOnTheScreen();
    expect(unlabelled).toBeDefined();
  });
});
