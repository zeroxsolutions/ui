import { render, screen, userEvent } from '@testing-library/react-native';
import { Bold } from 'lucide-react-native';
import { useState } from 'react';
import { registerCSS } from 'react-native-css-interop/test';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Icon } from './icon';
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

  it('takes a role from the caller and announces pressed over a caller aria-selected', async () => {
    await render(<Toggle pressed onPressedChange={() => {}} aria-label="Bold" role="checkbox" aria-selected={false} />);

    const control = screen.getByRole('checkbox', { name: 'Bold' });

    expect(control).toBeSelected();
  });

  it('draws the muted background only while pressed', async () => {
    await render(
      <>
        <Toggle pressed onPressedChange={() => {}} aria-label="On" />
        <Toggle pressed={false} onPressedChange={() => {}} aria-label="Off" />
      </>,
    );

    expect(emittedClasses(screen.getByRole('button', { name: 'On' }).props.className)).toContain('bg-muted');
    expect(emittedClasses(screen.getByRole('button', { name: 'Off' }).props.className)).not.toContain('bg-muted');
  });

  it('draws the outline variant and the small size', async () => {
    await render(<Toggle variant="outline" size="sm" pressed={false} onPressedChange={() => {}} aria-label="Bold" />);

    const classes = emittedClasses(screen.getByRole('button', { name: 'Bold' }).props.className);

    expect(classes).toEqual(expect.arrayContaining(['border', 'border-input', 'h-8', 'min-w-8']));
  });

  it('hands its Text the label classes and its Icon a 16px size', async () => {
    registerCSS('.cn-toggle\\/icon { width: 16px; height: 16px; }');
    await render(
      <Toggle pressed={false} onPressedChange={() => {}}>
        <Icon as={Bold} testID="glyph" />
        <Text>Bold</Text>
      </Toggle>,
    );

    const { width, height } = screen.getByTestId('glyph', { includeHiddenElements: true }).props;

    expect({ width, height }).toEqual({ width: 16, height: 16 });
    expect(emittedClasses('cn-toggle/icon')).toEqual(['size-4']);
    expect(emittedClasses(screen.getByText('Bold').props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'font-sans-medium']),
    );
  });

  it('announces disabled, is dimmed and ignores presses when disabled', async () => {
    const onPressedChange = jest.fn();
    const user = userEvent.setup();
    await render(<PressedToggle disabled onPressedChange={onPressedChange} />);
    const control = screen.getByRole('button', { name: 'Bold' });

    await user.press(control);

    expect(control.props.accessibilityState.disabled).toBe(true);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(emittedClasses(control.props.className)).toContain('disabled:opacity-50');
  });
});
