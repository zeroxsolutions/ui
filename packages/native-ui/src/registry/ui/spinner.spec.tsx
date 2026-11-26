import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
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

  it('turns while motion is allowed', async () => {
    reduceMotion(false);
    await render(<Spinner />);

    expect(screen.getByRole('progressbar').props.style).toEqual({ transform: [{ rotate: expect.anything() }] });
  });

  it('stands still when the person asked the system to reduce motion', async () => {
    reduceMotion(true);
    await render(<Spinner />);

    expect(screen.getByRole('progressbar').props.style).toBeUndefined();
  });

  it('stops turning when reduce motion is switched on while it shows', async () => {
    const setting = reduceMotion(false);
    await render(<Spinner />);

    await act(() => setting.change(true));

    expect(screen.getByRole('progressbar').props.style).toBeUndefined();
  });

  it('lets go of the reduce motion setting when it unmounts', async () => {
    const setting = reduceMotion(false);
    const { unmount } = await render(<Spinner />);

    await unmount();

    expect(setting.remove).toHaveBeenCalledTimes(1);
  });
});
