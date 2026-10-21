import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
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

/** The thumb, which the switch draws as its one child. */
function thumbOf(control: ReturnType<typeof screen.getByRole>) {
  const [thumb] = control.children;
  if (typeof thumb === 'string' || thumb === undefined) throw new Error('The switch drew no thumb');
  return thumb;
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

  it('draws the primary track when on and the input track when off', async () => {
    await render(
      <>
        <Switch checked onCheckedChange={() => {}} aria-label="On" />
        <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
      </>,
    );

    const on = emittedClasses(screen.getByRole('switch', { name: 'On' }).props.className);
    const off = emittedClasses(screen.getByRole('switch', { name: 'Off' }).props.className);

    expect(on).toContain('bg-primary');
    expect(on).not.toContain('bg-input');
    expect(off).toContain('bg-input');
    expect(off).not.toContain('bg-primary');
  });

  it.each([
    ['default', 'h-[18.4px]', 'w-[32px]', 'size-4', 'translate-x-[14px]'],
    ['sm', 'h-[14px]', 'w-[24px]', 'size-3', 'translate-x-[10px]'],
  ] as const)(
    'at the %s size moves the thumb to the far end when on',
    async (size, height, width, thumbSize, translate) => {
      await render(<Switch size={size} checked onCheckedChange={() => {}} aria-label="Wi-Fi" />);

      const track = emittedClasses(screen.getByRole('switch', { name: 'Wi-Fi' }).props.className);
      const thumb = emittedClasses(thumbOf(screen.getByRole('switch')).props.className);

      expect(track).toEqual(expect.arrayContaining([height, width]));
      expect(thumb).toEqual(expect.arrayContaining([thumbSize, translate]));
    },
  );

  it.each(['default', 'sm'] as const)('at the %s size keeps the thumb at the start when off', async (size) => {
    await render(<Switch size={size} checked={false} onCheckedChange={() => {}} aria-label="Wi-Fi" />);

    const thumb = emittedClasses(thumbOf(screen.getByRole('switch')).props.className);

    expect(thumb).toContain('translate-x-0');
    expect(thumb.some((name) => /^translate-x-\[/.test(name))).toBe(false);
  });

  describe('moving the thumb', () => {
    const stoppedTiming = () =>
      jest.spyOn(Animated, 'timing').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
    const offsetOf = () => {
      const [{ translateX }] = StyleSheet.flatten(thumbOf(screen.getByRole('switch')).props.style).transform as [
        { translateX: number },
      ];
      return translateX;
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      ['default', 14],
      ['sm', 10],
    ] as const)('slides the thumb over 150ms at the %s size when pressed', async (size, travel) => {
      const timing = stoppedTiming();
      const user = userEvent.setup();
      await render(<ToggledSwitch size={size} />);

      expect(timing).not.toHaveBeenCalled();
      expect(offsetOf()).toBe(0);

      await user.press(screen.getByRole('switch', { name: 'Wi-Fi' }));

      // The classes have already put the thumb at its new end, so it starts back at the old one.
      expect(offsetOf()).toBe(-travel);
      expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ toValue: 0, duration: 150 }));

      await user.press(screen.getByRole('switch', { name: 'Wi-Fi' }));

      expect(offsetOf()).toBe(travel);
    });

    it('does not slide when the system asks for reduced motion', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const timing = stoppedTiming();
      const user = userEvent.setup();
      await render(<ToggledSwitch />);

      await user.press(screen.getByRole('switch', { name: 'Wi-Fi' }));

      expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked();
      expect(timing).not.toHaveBeenCalled();
      expect(offsetOf()).toBe(0);
    });
  });

  it('announces disabled, is dimmed and ignores presses when disabled', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    await render(<ToggledSwitch disabled onCheckedChange={onCheckedChange} />);
    const control = screen.getByRole('switch', { name: 'Wi-Fi' });

    await user.press(control);

    expect(control).toBeDisabled();
    expect(control).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(emittedClasses(control.props.className)).toContain('opacity-50');
  });

  it('draws the destructive border when invalid', async () => {
    await render(<Switch checked={false} onCheckedChange={() => {}} aria-label="Wi-Fi" aria-invalid />);

    expect(emittedClasses(screen.getByRole('switch', { name: 'Wi-Fi' }).props.className)).toContain(
      'border-destructive',
    );
  });
});
