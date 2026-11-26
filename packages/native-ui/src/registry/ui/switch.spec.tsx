import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Switch, type SwitchProps } from './switch';

/** A Switch whose `checked` follows its own presses, as a caller's state would. */
function ToggledSwitch({
  onCheckedChange,
  ...props
}: Omit<SwitchProps, 'checked' | 'onCheckedChange'> & Partial<Pick<SwitchProps, 'onCheckedChange'>>) {
  const [checked, setChecked] = useState(false);
  return (
    <Switch
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onCheckedChange?.(next);
      }}
      aria-label="Wi-Fi"
      {...props}
    />
  );
}

describe('Switch', () => {
  it('is a switch that turns on when pressed and reports it', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledSwitch onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });

    expect(control).not.toBeChecked();

    await user.press(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toBeChecked();
  });

  it('turns off again on a second press', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledSwitch onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });

    await user.press(control);
    await user.press(control);

    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    expect(control).not.toBeChecked();
  });

  it('announces disabled and ignores presses when disabled', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledSwitch disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });

    await user.press(control);

    expect(control).toBeDisabled();
    expect(control).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
