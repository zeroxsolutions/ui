import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
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

  it('draws a dot in the selected item alone', async () => {
    await render(<PlanPicker />);

    expect(dotOf(screen.getByRole('radio', { name: 'Free' }))).toBeDefined();
    expect(dotOf(screen.getByRole('radio', { name: 'Pro' }))).toBeUndefined();
  });

  it('announces a disabled item and ignores its presses', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<PlanPicker proDisabled onValueChange={onValueChange} />);
    const pro = screen.getByRole('radio', { name: 'Pro' });

    await user.press(pro);

    expect(pro).toBeDisabled();
    expect(pro).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Team' })).not.toBeDisabled();
  });

  it('disables every item when the group is disabled', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<PlanPicker disabled onValueChange={onValueChange} />);

    await user.press(screen.getByRole('radio', { name: 'Team' }));

    expect(onValueChange).not.toHaveBeenCalled();
    for (const name of ['Free', 'Pro', 'Team']) {
      expect(screen.getByRole('radio', { name })).toBeDisabled();
    }
  });
});
