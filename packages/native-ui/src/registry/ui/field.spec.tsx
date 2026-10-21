import { render, screen, userEvent } from '@testing-library/react-native';
import { Switch as NativeSwitch, TextInput } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field';

function classesOf(testID: string, style: 'vega' | 'nova' = 'vega'): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className, style);
}

function textClassesOf(text: string): string[] {
  return emittedClasses(screen.getByText(text).props.className);
}

describe('Field', () => {
  it("is a group stacking its label, control and description with the style's gap", async () => {
    await render(
      <Field testID="field">
        <FieldLabel>Email</FieldLabel>
        <TextInput />
        <FieldDescription>We never share it.</FieldDescription>
      </Field>,
    );

    expect(screen.getByTestId('field').props.role).toBe('group');
    expect(classesOf('field')).toEqual(expect.arrayContaining(['w-full', 'flex-col', 'gap-3']));
    expect(classesOf('field', 'nova')).toContain('gap-2');
    expect(textClassesOf('Email')).toEqual(expect.arrayContaining(['text-sm', 'font-sans-medium', 'leading-snug']));
    expect(textClassesOf('We never share it.')).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-sm', 'leading-normal']),
    );
  });

  it('sets a horizontal field in a row, its label taking the room the control leaves', async () => {
    await render(
      <Field orientation="horizontal" testID="field">
        <NativeSwitch />
        <FieldLabel testID="label">Airplane mode</FieldLabel>
      </Field>,
    );

    expect(classesOf('field')).toEqual(expect.arrayContaining(['flex-row', 'items-center']));
    expect(classesOf('label')).toContain('flex-auto');
  });

  it('aligns a horizontal field to the top when it holds content', async () => {
    await render(
      <Field orientation="horizontal" testID="field">
        <NativeSwitch />
        <FieldContent testID="content">
          <FieldLabel>Marketing email</FieldLabel>
          <FieldDescription>News and offers.</FieldDescription>
        </FieldContent>
      </Field>,
    );

    expect(classesOf('field')).toContain('items-start');
    expect(classesOf('content')).toEqual(expect.arrayContaining(['flex-1', 'gap-1']));
  });

  it('draws the label of an invalid field in the destructive colour and keeps the description muted', async () => {
    await render(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <FieldDescription>We never share it.</FieldDescription>
      </Field>,
    );

    expect(textClassesOf('Email')).toContain('text-destructive');
    expect(textClassesOf('We never share it.')).toContain('text-muted-foreground');
    expect(textClassesOf('We never share it.')).not.toContain('text-destructive');
  });

  it('dims the label and the title of a disabled field', async () => {
    await render(
      <Field disabled>
        <FieldLabel testID="label">Email</FieldLabel>
        <FieldTitle>Plan</FieldTitle>
      </Field>,
    );

    expect(classesOf('label')).toContain('opacity-50');
    expect(textClassesOf('Plan')).toContain('opacity-50');
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

  it('draws a legend at the base size, or at the label size as a label', async () => {
    await render(
      <>
        <FieldLegend>Address</FieldLegend>
        <FieldLegend variant="label">Shipping</FieldLegend>
      </>,
    );

    expect(textClassesOf('Address')).toEqual(expect.arrayContaining(['text-base', 'font-sans-medium']));
    expect(textClassesOf('Shipping')).toContain('text-sm');
    expect(textClassesOf('Shipping')).not.toContain('text-base');
  });

  it('pulls a description up under its legend, outside the gap between the fields', async () => {
    await render(
      <FieldSet testID="set">
        <FieldLegend>Address</FieldLegend>
        <FieldDescription>Where we ship to.</FieldDescription>
        <FieldGroup testID="group" />
      </FieldSet>,
    );

    expect(textClassesOf('Where we ship to.')).toContain('-mt-1.5');
    expect(classesOf('set')).not.toContain('gap-6');
    const fields = screen.getByTestId('group').parent;
    expect(emittedClasses(fields?.props.className)).toContain('gap-6');
  });
});

describe('FieldGroup', () => {
  it('spaces its fields apart, and a group inside a group more tightly', async () => {
    await render(
      <FieldGroup testID="outer">
        <FieldGroup testID="inner" />
      </FieldGroup>,
    );

    expect(classesOf('outer')).toEqual(expect.arrayContaining(['w-full', 'flex-col', 'gap-7']));
    expect(classesOf('inner')).toContain('gap-4');
    expect(classesOf('inner')).not.toContain('gap-7');
  });
});

describe('FieldSeparator', () => {
  it('draws a rule with its text centred on it in the muted colour', async () => {
    await render(<FieldSeparator testID="separator">Or continue with</FieldSeparator>);

    expect(classesOf('separator')).toEqual(expect.arrayContaining(['h-5', '-my-2']));
    expect(textClassesOf('Or continue with')).toContain('text-muted-foreground');
  });
});

describe('FieldError', () => {
  it('announces its message in the destructive colour', async () => {
    await render(<FieldError testID="error">Enter an email.</FieldError>);

    expect(screen.getByTestId('error').props.role).toBe('alert');
    expect(textClassesOf('Enter an email.')).toEqual(expect.arrayContaining(['text-destructive', 'text-sm']));
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
