import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from './text';
import { Toggle, type ToggleProps } from './toggle';

type PressedToggleProps = Omit<ToggleProps, 'pressed' | 'onPressedChange'> &
  Partial<Pick<ToggleProps, 'onPressedChange'>>;

/** A Toggle whose `pressed` follows its own presses, as a caller's state would. */
function PressedToggle({ onPressedChange, ...props }: PressedToggleProps) {
  const [pressed, setPressed] = useState(false);
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={(next) => {
        setPressed(next);
        onPressedChange?.(next);
      }}
      {...props}
    >
      <Text>Bold</Text>
    </Toggle>
  );
}

describe('Toggle', () => {
  it('is a button that turns on when pressed and announces it selected', async () => {
    const onPressedChange = jest.fn();
    const user = userEvent.setup();
    await render(<PressedToggle onPressedChange={onPressedChange} />);
    const control = screen.getByRole('button', { name: 'Bold' });

    expect(control.props.accessibilityState.selected).toBe(false);

    await user.press(control);

    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(control.props.accessibilityState.selected).toBe(true);
    expect(control.props.accessibilityState.checked).toBeUndefined();
    expect(control.props['aria-checked']).toBeUndefined();
  });

  it("keeps a caller's own accessibility state beside selected", async () => {
    await render(<Toggle pressed onPressedChange={() => {}} aria-label="Bold" accessibilityState={{ busy: true }} />);

    expect(screen.getByRole('button', { name: 'Bold' }).props.accessibilityState).toEqual(
      expect.objectContaining({ busy: true, selected: true }),
    );
  });

  it("keeps a caller's disabled in its accessibility state when no disabled prop is given", async () => {
    await render(
      <Toggle pressed onPressedChange={() => {}} aria-label="Bold" accessibilityState={{ disabled: true }} />,
    );

    expect(screen.getByRole('button', { name: 'Bold' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true, selected: true }),
    );
  });

  it('takes a role from the caller and announces pressed over a caller aria-selected', async () => {
    await render(<Toggle pressed onPressedChange={() => {}} aria-label="Bold" role="checkbox" aria-selected={false} />);

    const control = screen.getByRole('checkbox', { name: 'Bold' });

    expect(control).toBeSelected();
  });

  it('announces disabled and ignores presses when disabled', async () => {
    const onPressedChange = jest.fn();
    const user = userEvent.setup();
    await render(<PressedToggle disabled onPressedChange={onPressedChange} />);
    const control = screen.getByRole('button', { name: 'Bold' });

    await user.press(control);

    expect(control.props.accessibilityState.disabled).toBe(true);
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});

describe('Toggle handlers', () => {
  it('forwards onPressIn', async () => {
    const onPressIn = jest.fn();
    await render(<Toggle aria-label="Bold" pressed={false} onPressedChange={jest.fn()} onPressIn={onPressIn} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Bold' }));

    expect(onPressIn).toHaveBeenCalledTimes(1);
  });
});
