import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { Spinner } from './spinner';

type ReduceMotionListener = (enabled: boolean) => void;

/** Answers the reduce-motion setting with `enabled` and hands back what changes it later. */
function reduceMotion(enabled: boolean): { change: ReduceMotionListener; remove: jest.Mock } {
  const remove = jest.fn();
  let listener: ReduceMotionListener = () => undefined;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
    listener = handler as ReduceMotionListener;
    return { remove };
  });
  return { change: (next) => listener(next), remove };
}

describe('Spinner', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is announced as a busy progress bar named Loading', async () => {
    reduceMotion(false);
    await render(<Spinner />);

    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner).toBeBusy();
  });

  it('takes the name a caller gives it', async () => {
    reduceMotion(false);
    await render(<Spinner aria-label="Saving" />);

    expect(screen.getByRole('progressbar', { name: 'Saving' })).toBeOnTheScreen();
  });

  it('turns a full circle each second on a loop while motion is allowed', async () => {
    reduceMotion(false);
    const timing = jest.spyOn(Animated, 'timing');
    const loop = jest.spyOn(Animated, 'loop');
    await render(<Spinner />);

    expect(loop).toHaveBeenCalledTimes(1);
    expect(timing.mock.calls.map(([, config]) => [config.toValue, config.duration])).toEqual([[1, 1000]]);
    expect(screen.getByRole('progressbar').props.style).toEqual(
      expect.objectContaining({ transform: [{ rotate: expect.anything() }] }),
    );
  });

  it('stands still when the person asked the system to reduce motion', async () => {
    reduceMotion(true);
    const loop = jest.spyOn(Animated, 'loop');
    await render(<Spinner />);

    expect(loop).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar').props.style).toBeUndefined();
  });

  it('stops turning when reduce motion is switched on while it shows', async () => {
    const setting = reduceMotion(false);
    const stop = jest.fn();
    jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() });
    await render(<Spinner />);

    await act(() => setting.change(true));

    expect(stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('progressbar').props.style).toBeUndefined();
  });

  it('stops the loop and the setting subscription when it unmounts', async () => {
    const setting = reduceMotion(false);
    const stop = jest.fn();
    jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() });
    const { unmount } = await render(<Spinner />);

    await unmount();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(setting.remove).toHaveBeenCalledTimes(1);
  });
});
