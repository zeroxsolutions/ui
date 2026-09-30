import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

afterEach(() => {
  cleanup();
});

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
  it('associates the label with the control and reflects the value', () => {
    render(<NameEditor value={{ name: 'pdf-toolkit' }} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('pdf-toolkit');
  });

  it('shows the description the field composes', () => {
    render(<NameEditor value={{ name: 'a' }} />);
    expect(screen.getByText('Lowercase, dash-separated.')).toBeTruthy();
  });

  it('reports the next document when a field changes (controlled)', () => {
    const onValueChange = vi.fn();
    render(<NameEditor value={{ name: 'a', description: 'keep' }} onValueChange={onValueChange} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'ab' },
    });
    // Merges into the existing document - other keys are preserved.
    expect(onValueChange).toHaveBeenCalledWith({
      name: 'ab',
      description: 'keep',
    });
  });

  it("calls the control's own onChange as well as binding the value", () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <FrontmatterForm value={{ name: 'a' }} onValueChange={onValueChange}>
        <FrontmatterFormField name="name">
          <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
          <FrontmatterFormFieldControl render={<Input onChange={onChange} />} />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'ab' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith({ name: 'ab' });
  });

  it('shows the consumer error and wires invalid-state a11y', () => {
    render(<NameEditor value={{ name: '' }} errors={{ name: 'Name is required.' }} />);
    const input = screen.getByLabelText('Name');
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('Name is required.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
  });

  it('renders no error region when the field is valid', () => {
    render(<NameEditor value={{ name: 'ok' }} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBeNull();
  });

  it('exposes the field binding via useFrontmatterFormField for custom controls', () => {
    const onValueChange = vi.fn();

    function ToggleField() {
      const field = useFrontmatterFormField();
      return (
        <button type="button" onClick={() => field.setValue(!field.value)}>
          {field.value ? 'on' : 'off'}
        </button>
      );
    }

    render(
      <FrontmatterForm value={{ network: false }} onValueChange={onValueChange}>
        <FrontmatterFormField name="network">
          <ToggleField />
        </FrontmatterFormField>
      </FrontmatterForm>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'off' }));
    expect(onValueChange).toHaveBeenCalledWith({ network: true });
  });
});
