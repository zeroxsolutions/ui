import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Checkbox, type CheckboxProps } from './checkbox';

type ToggledCheckboxProps = Omit<CheckboxProps, 'checked' | 'onCheckedChange'> &
  Partial<Pick<CheckboxProps, 'onCheckedChange'>>;

/** A Checkbox whose `checked` follows its own presses, as a caller's state would. */
function ToggledCheckbox({ onCheckedChange, ...props }: ToggledCheckboxProps) {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onCheckedChange?.(next);
      }}
      aria-label="Accept terms"
      {...props}
    />
  );
}

type HostElement = ReturnType<typeof screen.getByRole>;

/** The one host child of `element`, or undefined when it has none. */
function onlyChildOf(element: HostElement | undefined): HostElement | undefined {
  const [child] = element?.children ?? [];
  return typeof child === 'string' ? undefined : child;
}

/** The check mark's svg, drawn inside the checkbox's indicator, or undefined while it draws none. */
function checkMarkOf(control: HostElement): HostElement | undefined {
  return onlyChildOf(onlyChildOf(control));
}

describe('Checkbox', () => {
  it('is a checkbox that checks when pressed and reports it', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledCheckbox onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('checkbox', { name: 'Accept terms' });

    expect(control).not.toBeChecked();

    await user.press(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toBeChecked();

    await user.press(control);

    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    expect(control).not.toBeChecked();
  });

  it('draws a check mark while checked, and none while unchecked', async () => {
    await render(
      <>
        <Checkbox checked onCheckedChange={() => {}} aria-label="On" />
        <Checkbox checked={false} onCheckedChange={() => {}} aria-label="Off" />
      </>,
    );

    expect(checkMarkOf(screen.getByRole('checkbox', { name: 'On' }))).toBeDefined();
    expect(checkMarkOf(screen.getByRole('checkbox', { name: 'Off' }))).toBeUndefined();
  });

  it('announces disabled and ignores presses when disabled', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledCheckbox disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('checkbox', { name: 'Accept terms' });

    await user.press(control);

    expect(control).toBeDisabled();
    expect(control).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
