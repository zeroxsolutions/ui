import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import { FieldDescription } from '../../ui/field';
import { Input } from '../../ui/input';
import { Text } from '../../ui/text';
import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  useFrontmatterFormField,
  type FrontmatterFormValue,
} from './frontmatter-form';

/** One name field, as the demo composes it. */
function NameEditor({
  value,
  onValueChange = () => undefined,
  errors,
  control = <Input />,
}: {
  value: FrontmatterFormValue;
  onValueChange?: (value: FrontmatterFormValue) => void;
  errors?: Record<string, string>;
  control?: Parameters<typeof FrontmatterFormFieldControl>[0]['render'];
}) {
  return (
    <FrontmatterForm value={value} onValueChange={onValueChange} errors={errors}>
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={control} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

describe('FrontmatterForm', () => {
  it("names the control by its field's label and shows the field's value", async () => {
    await render(<NameEditor value={{ name: 'pdf-toolkit' }} />);

    expect(screen.getByLabelText('Name')).toHaveDisplayValue('pdf-toolkit');
  });

  it('shows a value that is not a string as its text, and a missing one as empty', async () => {
    await render(
      <FrontmatterForm value={{ version: 2 }} onValueChange={() => undefined}>
        <FrontmatterFormField name="version">
          <FrontmatterFormFieldLabel>Version</FrontmatterFormFieldLabel>
          <FrontmatterFormFieldControl render={<Input />} />
        </FrontmatterFormField>
        <FrontmatterFormField name="license">
          <FrontmatterFormFieldLabel>License</FrontmatterFormFieldLabel>
          <FrontmatterFormFieldControl render={<Input />} />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );

    expect(screen.getByLabelText('Version')).toHaveDisplayValue('2');
    expect(screen.getByLabelText('License')).toHaveDisplayValue('');
  });

  it('reports the whole document with the typed field changed', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<NameEditor value={{ name: 'a', description: 'keep' }} onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('Name'), 'b');

    expect(onValueChange).toHaveBeenLastCalledWith({
      name: 'ab',
      description: 'keep',
    });
  });

  it("runs the control's own onChangeText as well as binding the value", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    const onChangeText = jest.fn();
    await render(
      <NameEditor
        value={{ name: 'a' }}
        onValueChange={onValueChange}
        control={<Input onChangeText={onChangeText} />}
      />,
    );

    await user.type(screen.getByLabelText('Name'), 'b');

    expect(onChangeText.mock.calls).toEqual([['ab']]);
    expect(onValueChange.mock.calls).toEqual([[{ name: 'ab' }]]);
  });

  it('shows the error, marks the control invalid and gives it the error as its hint', async () => {
    await render(<NameEditor value={{ name: '' }} errors={{ name: 'Name is required.' }} />);

    expect(screen.getByText('Name is required.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Name')).toHaveProp('aria-invalid', true);
    expect(screen.getByHintText('Name is required.')).toBe(screen.getByLabelText('Name'));
  });

  it("keeps the control's own hint while its field is valid, showing another field's error nowhere", async () => {
    await render(
      <NameEditor
        value={{ name: 'ok' }}
        errors={{ description: 'Required.' }}
        control={<Input accessibilityHint="Lowercase." />}
      />,
    );

    expect(screen.queryByText('Required.')).toBeNull();
    expect(screen.getByLabelText('Name')).not.toHaveProp('aria-invalid', true);
    expect(screen.getByHintText('Lowercase.')).toBe(screen.getByLabelText('Name'));
  });

  it('shows the description the field composes', async () => {
    await render(<NameEditor value={{ name: 'a' }} />);

    expect(screen.getByText('Lowercase, dash-separated.')).toBeOnTheScreen();
  });

  it('binds a control of its own through useFrontmatterFormField', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();

    function NetworkSwitch() {
      const field = useFrontmatterFormField();
      return (
        <Pressable role="switch" aria-checked={field.value === true} onPress={() => field.setValue(!field.value)}>
          <Text>Network</Text>
        </Pressable>
      );
    }

    await render(
      <FrontmatterForm value={{ network: false, name: 'a' }} onValueChange={onValueChange}>
        <FrontmatterFormField name="network">
          <NetworkSwitch />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );

    await user.press(screen.getByRole('switch', { name: 'Network' }));

    expect(onValueChange.mock.calls).toEqual([[{ network: true, name: 'a' }]]);
  });

  it('throws when a field part is outside a FrontmatterFormField, or a field outside a FrontmatterForm', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>)).rejects.toThrow(
      'useFrontmatterFormField / FrontmatterFormField parts must be used within <FrontmatterFormField>',
    );
    await expect(render(<FrontmatterFormField name="name" />)).rejects.toThrow(
      'FrontmatterForm parts must be used within <FrontmatterForm>',
    );
    jest.restoreAllMocks();
  });
});
