import { render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, TextInput } from 'react-native';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from './field';

describe('Field', () => {
  it('is a group', async () => {
    await render(
      <Field testID="field">
        <FieldLabel>Email</FieldLabel>
        <TextInput />
        <FieldDescription>We never share it.</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId('field').props.role).toBe('group');
  });

  it('runs the label onPress, for the caller to focus the control', async () => {
    const onPress = jest.fn();
    await render(
      <Field>
        <FieldLabel onPress={onPress}>Email</FieldLabel>
      </Field>,
    );

    await userEvent.setup().press(screen.getByText('Email'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('FieldSet', () => {
  it('is a group named by its legend', async () => {
    await render(
      <FieldSet testID="set">
        <FieldLegend>Address</FieldLegend>
        <FieldGroup />
      </FieldSet>,
    );

    const legend = screen.getByText('Address');
    expect(screen.getByTestId('set').props.role).toBe('group');
    expect(legend.props.nativeID).toEqual(expect.any(String));
    expect(screen.getByTestId('set').props['aria-labelledby']).toBe(legend.props.nativeID);
  });
});

describe('FieldSeparator', () => {
  it('sets text written with a value inside it in one Text', async () => {
    const provider = 'GitHub';
    await render(<FieldSeparator>Or use {provider}</FieldSeparator>);

    expect(screen.getByText('Or use GitHub')).toBeOnTheScreen();
  });
});

describe('FieldError', () => {
  it('carries the alert role', async () => {
    await render(<FieldError testID="error">Enter an email.</FieldError>);

    expect(screen.getByTestId('error').props.role).toBe('alert');
  });

  it('is a polite live region, which TalkBack reads when its message changes', async () => {
    await render(<FieldError testID="error">Enter an email.</FieldError>);

    expect(screen.getByTestId('error').props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces its message when it appears and when it changes, and not again for the same message', async () => {
    // React Native's jest setup makes announceForAccessibility one shared mock, so its calls carry over between tests.
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
    const { rerender } = await render(<FieldError errors={[]} />);

    await rerender(<FieldError errors={[{ message: 'Too short.' }]} />);
    await rerender(<FieldError errors={[{ message: 'Too short.' }]} />);
    await rerender(<FieldError>Enter an email.</FieldError>);

    expect(announce.mock.calls).toEqual([['Too short.'], ['Enter an email.']]);
  });

  it('draws and announces a message written with a value inside it', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
    const min = 8;
    await render(<FieldError>Use at least {min} characters.</FieldError>);

    expect(screen.getByText('Use at least 8 characters.')).toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith('Use at least 8 characters.');
  });

  it('draws the message of a single error', async () => {
    await render(<FieldError errors={[{ message: 'Too short.' }, { message: 'Too short.' }]} />);

    expect(screen.getByText('Too short.')).toBeOnTheScreen();
  });

  it('lists several errors, each once', async () => {
    await render(<FieldError errors={[{ message: 'Too short.' }, undefined, { message: 'Needs a digit.' }]} />);

    expect(screen.getAllByRole('listitem').map((item) => item.props.children)).toEqual([
      '\u2022 Too short.',
      '\u2022 Needs a digit.',
    ]);
  });

  it('draws nothing with no error', async () => {
    await render(<FieldError errors={[]} />);

    expect(screen.toJSON()).toBeNull();
  });
});
