import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FrontmatterForm,
  FrontmatterFormField,
  FrontmatterFormFieldControl,
  FrontmatterFormFieldError,
  FrontmatterFormFieldLabel,
  useFrontmatterFormField,
  type FrontmatterFormValue,
} from './frontmatter-form';
import { Input } from '@/registry/bases/base-ui/ui/input';

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
    <FrontmatterForm value={value} onValueChange={onValueChange} errors={errors}>
      <FrontmatterFormField name="name">
        <FrontmatterFormFieldLabel>Name</FrontmatterFormFieldLabel>
        <FrontmatterFormFieldControl render={<Input />} />
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

  it('reports the next document when a field changes (controlled)', () => {
    const onValueChange = vi.fn();
    render(<NameEditor value={{ name: 'a', description: 'keep' }} onValueChange={onValueChange} />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'ab' },
    });
    // Merges into the existing document — other keys are preserved.
    expect(onValueChange).toHaveBeenCalledWith({
      name: 'ab',
      description: 'keep',
    });
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
