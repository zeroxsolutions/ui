import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { RadioGroup, RadioGroupItem } from './radio-group';

type PlanPickerProps = {
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  proDisabled?: boolean;
  invalid?: boolean;
};

/** A group of three plans whose value follows its own presses, as a caller's state would. */
function PlanPicker({ onValueChange, disabled, proDisabled, invalid }: PlanPickerProps) {
  const [value, setValue] = useState<string | undefined>('free');
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
      disabled={disabled}
      testID="plans"
    >
      <RadioGroupItem value="free" aria-label="Free" aria-invalid={invalid} />
      <RadioGroupItem value="pro" aria-label="Pro" disabled={proDisabled} aria-invalid={invalid} />
      <RadioGroupItem value="team" aria-label="Team" aria-invalid={invalid} />
    </RadioGroup>
  );
}

type HostElement = ReturnType<typeof screen.getByRole>;

/** The one host child of `element`, or undefined when it has none. */
function onlyChildOf(element: HostElement | undefined): HostElement | undefined {
  const [child] = element?.children ?? [];
  return typeof child === 'string' ? undefined : child;
}

/** The dot an item draws inside its indicator, or undefined while it draws none. */
function dotOf(item: HostElement): HostElement | undefined {
  return onlyChildOf(onlyChildOf(item));
}

describe('RadioGroup', () => {
  it('is a radio group whose pressed item becomes the one selected', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<PlanPicker onValueChange={onValueChange} />);

    expect(screen.getByTestId('plans').props.role).toBe('radiogroup');
    expect(screen.getByRole('radio', { name: 'Free' })).toBeChecked();

    await user.press(screen.getByRole('radio', { name: 'Team' }));

    expect(onValueChange).toHaveBeenCalledWith('team');
    expect(screen.getByRole('radio', { name: 'Team' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Free' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pro' })).not.toBeChecked();
  });

  it('spaces its items by 12px in a column', async () => {
    await render(<PlanPicker />);

    const classes = emittedClasses(screen.getByTestId('plans').props.className);

    expect(classes).toContain('gap-3');
    expect(classes).not.toContain('grid');
  });

  it('fills the selected item with the primary colour and draws its dot', async () => {
    await render(<PlanPicker />);
    const selected = screen.getByRole('radio', { name: 'Free' });
    const other = screen.getByRole('radio', { name: 'Pro' });

    expect(emittedClasses(selected.props.className)).toEqual(expect.arrayContaining(['bg-primary', 'border-primary']));
    expect(emittedClasses(other.props.className)).toEqual(
      expect.arrayContaining(['border-input', 'border', 'rounded-full']),
    );
    expect(emittedClasses(other.props.className)).not.toContain('bg-primary');

    expect(emittedClasses(dotOf(selected)?.props.className)).toEqual(
      expect.arrayContaining(['bg-primary-foreground', 'size-2', 'rounded-full']),
    );
    expect(dotOf(other)).toBeUndefined();
  });

  it("centres the dot with the indicator's flex rather than an offset and a translate", async () => {
    await render(<PlanPicker />);
    const selected = screen.getByRole('radio', { name: 'Free' });

    const indicator = emittedClasses(onlyChildOf(selected)?.props.className);
    const dot = emittedClasses(dotOf(selected)?.props.className);

    expect(indicator).toEqual(expect.arrayContaining(['size-4', 'items-center', 'justify-center']));
    expect(dot.filter((name) => /^(-?translate-|absolute$|top-|left-)/.test(name))).toEqual([]);
  });

  it('announces a disabled item, dims it and ignores its presses', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<PlanPicker proDisabled onValueChange={onValueChange} />);
    const pro = screen.getByRole('radio', { name: 'Pro' });

    await user.press(pro);

    expect(pro).toBeDisabled();
    expect(pro).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(emittedClasses(pro.props.className)).toContain('opacity-50');
    expect(screen.getByRole('radio', { name: 'Team' })).not.toBeDisabled();
  });

  it('disables and dims every item when the group is disabled', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<PlanPicker disabled onValueChange={onValueChange} />);

    await user.press(screen.getByRole('radio', { name: 'Team' }));

    expect(onValueChange).not.toHaveBeenCalled();
    for (const name of ['Free', 'Pro', 'Team']) {
      const item = screen.getByRole('radio', { name });
      expect(item).toBeDisabled();
      expect(emittedClasses(item.props.className)).toContain('opacity-50');
    }
  });

  it('draws the destructive border on an invalid item, and the primary one on the selected item', async () => {
    await render(<PlanPicker invalid />);

    const selected = emittedClasses(screen.getByRole('radio', { name: 'Free' }).props.className);
    const other = emittedClasses(screen.getByRole('radio', { name: 'Pro' }).props.className);

    expect(other).toContain('border-destructive');
    expect(selected).toContain('border-primary');
    expect(selected).not.toContain('border-destructive');
  });
});
