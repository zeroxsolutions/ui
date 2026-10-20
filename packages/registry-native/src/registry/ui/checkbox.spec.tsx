import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
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

  it('fills with the primary colour when checked', async () => {
    await render(
      <>
        <Checkbox checked onCheckedChange={() => {}} aria-label="On" />
        <Checkbox checked={false} onCheckedChange={() => {}} aria-label="Off" />
      </>,
    );

    const on = emittedClasses(screen.getByRole('checkbox', { name: 'On' }).props.className);
    const off = emittedClasses(screen.getByRole('checkbox', { name: 'Off' }).props.className);

    expect(on).toEqual(expect.arrayContaining(['bg-primary', 'border-primary']));
    expect(off).toEqual(expect.arrayContaining(['border-input', 'size-4', 'rounded-[4px]']));
    expect(off).not.toContain('bg-primary');
  });

  it('draws a 14px check mark in the colour of a checked box', async () => {
    // The source still holds the slot token, so it is registered with a stand-in colour; the
    // token's translation is pinned below.
    registerCSS('.size-3\\.5 { width: 14px; height: 14px; } .cn-checkbox\\/text\\@checked { color: rgb(1, 2, 3); }');
    await render(<Checkbox checked onCheckedChange={() => {}} aria-label="Accept terms" />);

    const { width, height, stroke } = checkMarkOf(screen.getByRole('checkbox', { name: 'Accept terms' }))?.props ?? {};

    expect({ width, height, stroke }).toEqual({ width: 14, height: 14, stroke: '#010203' });
    expect(emittedClasses('cn-checkbox/text@checked')).toEqual(['text-primary-foreground']);
  });

  it('draws no check mark when unchecked', async () => {
    await render(<Checkbox checked={false} onCheckedChange={() => {}} aria-label="Accept terms" />);

    expect(checkMarkOf(screen.getByRole('checkbox', { name: 'Accept terms' }))).toBeUndefined();
  });

  it('announces disabled, is dimmed and ignores presses when disabled', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledCheckbox disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('checkbox', { name: 'Accept terms' });

    await user.press(control);

    expect(control).toBeDisabled();
    expect(control).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(emittedClasses(control.props.className)).toContain('opacity-50');
  });

  it('draws the destructive border when invalid, and the primary one once checked', async () => {
    await render(
      <>
        <Checkbox checked={false} onCheckedChange={() => {}} aria-label="Off" aria-invalid />
        <Checkbox checked onCheckedChange={() => {}} aria-label="On" aria-invalid />
      </>,
    );

    const off = emittedClasses(screen.getByRole('checkbox', { name: 'Off' }).props.className);
    const on = emittedClasses(screen.getByRole('checkbox', { name: 'On' }).props.className);

    expect(off).toContain('border-destructive');
    expect(on).toContain('border-primary');
    expect(on).not.toContain('border-destructive');
  });
});
