import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { FieldDescription } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  useFrontmatterFormField,
  type FrontmatterFormValue,
} from './frontmatter-form';

function NameEditor({
  value,
  onValueChange = () => {},
  errors,
}: {
  value: FrontmatterFormValue;
  onValueChange?: (value: FrontmatterFormValue) => void;
  errors?: Record<string, string>;
}) {
  return (
    <FrontmatterForm value={value} onValueChange={onValueChange} errors={errors} data-testid="form">
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input />} />
        <FieldDescription>Lowercase, dash-separated.</FieldDescription>
        <FrontmatterFormFieldError />
      </FrontmatterFormField>
    </FrontmatterForm>
  );
}

describe('FrontmatterForm', () => {
  it('associates the label with the control and reflects the value', async () => {
    await render(<NameEditor value={{ name: 'pdf-toolkit' }} />);
    await expect.element(page.getByLabelText('Name')).toHaveValue('pdf-toolkit');
  });

  it('shows the description the field composes', async () => {
    await render(<NameEditor value={{ name: 'a' }} />);
    await expect.element(page.getByText('Lowercase, dash-separated.')).toBeVisible();
  });

  it('reports the next document, keeping its other keys, as a field is typed in', async () => {
    const onValueChange = vi.fn();
    await render(<NameEditor value={{ name: 'a', description: 'keep' }} onValueChange={onValueChange} />);
    await userEvent.type(page.getByLabelText('Name'), 'b');
    expect(onValueChange).toHaveBeenCalledWith({
      name: 'ab',
      description: 'keep',
    });
  });

  it("calls the control's own onChange as well as binding the value", async () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    await render(
      <FrontmatterForm value={{ name: 'a' }} onValueChange={onValueChange}>
        <FrontmatterFormField name="name">
          <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
          <FrontmatterFormFieldControl render={<Input onChange={onChange} />} />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );
    await userEvent.type(page.getByLabelText('Name'), 'b');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith({ name: 'ab' });
  });

  it('shows the consumer error and wires invalid-state a11y', async () => {
    await render(<NameEditor value={{ name: '' }} errors={{ name: 'Name is required.' }} />);
    const input = page.getByLabelText('Name');
    await expect.element(page.getByRole('alert')).toHaveTextContent('Name is required.');
    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    await expect.element(input).toHaveAccessibleDescription(expect.stringContaining('Name is required.'));
  });

  it('renders no error region when the field is valid', async () => {
    await render(<NameEditor value={{ name: 'ok' }} />);
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
    await expect.element(page.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('exposes the field binding via useFrontmatterFormField for custom controls', async () => {
    const onValueChange = vi.fn();

    function ToggleField() {
      const field = useFrontmatterFormField();
      return (
        <button type="button" onClick={() => field.setValue(!field.value)}>
          {field.value ? 'on' : 'off'}
        </button>
      );
    }

    await render(
      <FrontmatterForm value={{ network: false }} onValueChange={onValueChange}>
        <FrontmatterFormField name="network">
          <ToggleField />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );

    await userEvent.click(page.getByRole('button', { name: 'off' }));
    expect(onValueChange).toHaveBeenCalledWith({ network: true });
  });
});
