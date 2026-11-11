import { render, screen, userEvent } from '@testing-library/react-native';
import { ResizeHandle, type ResizeHandleProps } from './resize-handle';

/** The handle as its demo places it: beside a panel 160px wide, which may go from 48px to 320px. */
function Handle(props: Partial<ResizeHandleProps>) {
  return (
    <ResizeHandle
      aria-label="Resize panel"
      value={160}
      min={48}
      max={320}
      onDrag={() => undefined}
      onToggle={() => undefined}
      {...props}
    />
  );
}

describe('ResizeHandle', () => {
  it("is announced as adjustable, valued at the panel's width within its range", async () => {
    await render(<Handle />);

    const handle = screen.getByRole('adjustable', { name: 'Resize panel' });
    expect(handle).toHaveAccessibilityValue({ now: 160, min: 48, max: 320 });
  });

  it("grows and shrinks the panel by its step on a screen reader's increment and decrement", async () => {
    const user = userEvent.setup();
    const onDrag = jest.fn();
    await render(<Handle step={24} onDrag={onDrag} />);

    await user.accessibilityAction(screen.getByRole('adjustable'), 'increment');
    await user.accessibilityAction(screen.getByRole('adjustable'), 'decrement');

    expect(onDrag.mock.calls).toEqual([[24], [-24]]);
  });

  it('adjusts by 10px when no step is given', async () => {
    const user = userEvent.setup();
    const onDrag = jest.fn();
    await render(<Handle onDrag={onDrag} />);

    await user.accessibilityAction(screen.getByRole('adjustable'), 'increment');

    expect(onDrag.mock.calls).toEqual([[10]]);
  });

  it('toggles on a double tap, and resizes on neither tap', async () => {
    const user = userEvent.setup();
    const onDrag = jest.fn();
    const onToggle = jest.fn();
    await render(<Handle onDrag={onDrag} onToggle={onToggle} />);

    await user.press(screen.getByRole('adjustable'));
    expect(onToggle).not.toHaveBeenCalled();

    await user.press(screen.getByRole('adjustable'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });

  it('takes two taps far apart as two single taps', async () => {
    jest.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const onToggle = jest.fn();
      await render(<Handle onToggle={onToggle} />);

      await user.press(screen.getByRole('adjustable'));
      jest.advanceTimersByTime(1000);
      await user.press(screen.getByRole('adjustable'));

      expect(onToggle).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
