import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Toaster, toast, useSonner, type ToasterProps } from './sonner';
import { Text } from './text';

const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

/** Long enough for a toast to come in or go out. */
const MOTION_MS = 500;

async function show(props: ToasterProps = {}): Promise<void> {
  await render(<Toaster {...props} />);
}

/** Calls `make` as an app's code does, outside React, and lets the Toaster draw what it made. */
async function raise<T>(make: () => T): Promise<T> {
  let made: T | undefined;
  await act(async () => {
    made = make();
  });
  await elapse(MOTION_MS);
  return made as T;
}

/** The nearest element above `element` that is a live region. */
function liveRegionAround(element: ReturnType<typeof screen.getByText>) {
  let at = element.parent;
  while (at && at.props['aria-live'] === undefined) at = at.parent;
  return at;
}

/** How far the layer that moves a toast has moved it down, as its animated style says. */
function lift(box: ReturnType<typeof screen.getByTestId>): number | undefined {
  const moved = box.parent;
  if (!moved) throw new Error('No moving layer');
  const transform = (getAnimatedStyle(moved) as { transform?: Record<string, number>[] }).transform ?? [];
  return transform.find((entry) => 'translateY' in entry)?.translateY;
}

/** The nearest element at or above the one showing `title` that takes the prop `prop`. */
function around(title: string, prop: string) {
  let at: ReturnType<typeof screen.getByText> | null = screen.getByText(title);
  while (at && at.props[prop] === undefined) at = at.parent;
  if (!at) throw new Error(`Nothing around ${title} takes ${prop}`);
  return at;
}

function Count() {
  const { toasts } = useSonner();
  return <Text>{`${toasts.length} toasts`}</Text>;
}

describe('Toaster', () => {
  let announce: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await act(async () => {
      toast.dismiss();
    });
    await elapse(MOTION_MS);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('draws a toast with its description', async () => {
    await show();

    await raise(() => toast('Event has been created', { description: 'Monday, January 3rd at 6:00pm' }));

    expect(screen.getByText('Event has been created')).toBeOnTheScreen();
    expect(screen.getByText('Monday, January 3rd at 6:00pm')).toBeOnTheScreen();
  });

  it('announces a new toast on iOS, and is a polite live region for Android', async () => {
    await show();

    await raise(() => toast('Event has been created', { description: 'Monday, January 3rd at 6:00pm' }));

    expect(Platform.OS).toBe('ios');
    expect(announce).toHaveBeenCalledWith('Event has been created, Monday, January 3rd at 6:00pm');
    expect(liveRegionAround(screen.getByText('Event has been created'))).toHaveProp('aria-live', 'polite');
  });

  it('closes after its duration, four seconds by default, and says so', async () => {
    const onAutoClose = jest.fn();
    await show();
    await raise(() => toast('Saved', { onAutoClose }));

    await elapse(3000);
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    await elapse(1000 + MOTION_MS);

    expect(screen.queryByText('Saved')).toBeNull();
    expect(onAutoClose).toHaveBeenCalledWith(expect.objectContaining({ title: 'Saved' }));
  });

  it("takes the Toaster's duration, and a toast's own over it", async () => {
    await show({ duration: 1000 });
    await raise(() => toast('Short'));
    await raise(() => toast('Long', { duration: 3000 }));

    await elapse(1000);

    expect(screen.queryByText('Short')).toBeNull();
    expect(screen.getByText('Long')).toBeOnTheScreen();
  });

  it('goes on toast.dismiss, and reports it', async () => {
    const onDismiss = jest.fn();
    await show();
    const id = await raise(() => toast('Saved', { onDismiss }));

    await raise(() => toast.dismiss(id));

    expect(screen.queryByText('Saved')).toBeNull();
    expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ id }));
  });

  it('keeps a loading toast up, with a spinner, until it is updated by its id', async () => {
    await show();
    const id = await raise(() => toast.loading('Uploading'));

    await elapse(10_000);
    expect(screen.getByText('Uploading')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeOnTheScreen();

    await raise(() => toast.success('Uploaded', { id }));
    expect(screen.queryByText('Uploading')).toBeNull();
    expect(screen.getByText('Uploaded')).toBeOnTheScreen();
    expect(announce).toHaveBeenLastCalledWith('Uploaded');
  });

  it("follows a promise from its loading message to its result's", async () => {
    await show();
    let resolve: (name: string) => void = () => undefined;
    const saving = new Promise<string>((done) => {
      resolve = done;
    });

    await raise(() =>
      toast.promise(saving, { loading: 'Saving', success: (name: string) => `${name} saved`, error: 'Failed' }),
    );
    expect(screen.getByText('Saving')).toBeOnTheScreen();

    await raise(() => resolve('Report'));

    expect(screen.getByText('Report saved')).toBeOnTheScreen();
  });

  it('runs its action and closes', async () => {
    const onClick = jest.fn();
    await show();
    await raise(() => toast('Event has been created', { action: { label: 'Undo', onClick } }));

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    await elapse(MOTION_MS);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Event has been created')).toBeNull();
  });

  it('closes from its close button when asked for one', async () => {
    await show({ closeButton: true });
    await raise(() => toast('Saved'));

    await fireEvent.press(screen.getByRole('button', { name: 'Close toast' }));
    await elapse(MOTION_MS);

    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('shows three toasts at a time, the oldest hidden behind them', async () => {
    await show();
    for (const title of ['One', 'Two', 'Three', 'Four']) await raise(() => toast(title));

    expect(screen.queryByText('One')).toBeNull();
    expect(screen.getByText('Four')).toBeOnTheScreen();
  });

  it('goes on a swipe toward its edge, and stays on a short one', async () => {
    await show();
    await raise(() => toast('Saved', { testId: 'toast' }));
    const box = screen.getByTestId('toast');

    await fireEvent(box, 'responderGrant', { nativeEvent: { pageX: 0, pageY: 0, timestamp: 0 } });
    await fireEvent(box, 'responderMove', { nativeEvent: { pageX: 0, pageY: 20, timestamp: 400 } });
    await fireEvent(box, 'responderRelease', { nativeEvent: { pageX: 0, pageY: 20, timestamp: 800 } });
    await elapse(MOTION_MS);
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await fireEvent(box, 'responderGrant', { nativeEvent: { pageX: 0, pageY: 0, timestamp: 1000 } });
    await fireEvent(box, 'responderMove', { nativeEvent: { pageX: 0, pageY: 60, timestamp: 1400 } });
    await fireEvent(box, 'responderRelease', { nativeEvent: { pageX: 0, pageY: 60, timestamp: 1800 } });
    await elapse(MOTION_MS);

    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('springs back from a short swipe at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await show();
    await raise(() => toast('Saved', { testId: 'toast' }));
    const box = screen.getByTestId('toast');

    await fireEvent(box, 'responderGrant', { nativeEvent: { pageX: 0, pageY: 0, timestamp: 0 } });
    await fireEvent(box, 'responderMove', { nativeEvent: { pageX: 0, pageY: 20, timestamp: 400 } });
    await elapse(20);
    expect(lift(box)).toBe(20);
    await fireEvent(box, 'responderRelease', { nativeEvent: { pageX: 0, pageY: 20, timestamp: 800 } });
    // A frame, well short of the spring back's animation.
    await elapse(20);

    expect(lift(box)).toBe(0);
  });

  it('lists the toasts that are up through useSonner', async () => {
    await render(
      <>
        <Toaster />
        <Count />
      </>,
    );

    await raise(() => toast('One'));
    await raise(() => toast('Two'));

    expect(screen.getByText('2 toasts')).toBeOnTheScreen();
  });

  it('collapses on Escape with focus in the stack, as upstream does, and runs its time again', async () => {
    await show();
    await raise(() => toast('One'));
    await raise(() => toast('Two'));
    await fireEvent(around('Two', 'onTouchStart'), 'touchStart');
    await elapse(10_000);
    expect(screen.getByText('One')).toBeOnTheScreen();

    await fireEvent(around('Two', 'onKeyDown'), 'keyDown', { nativeEvent: { key: 'Escape' } });
    await elapse(4_000 + MOTION_MS);

    expect(screen.queryByText('One')).toBeNull();
    expect(screen.queryByText('Two')).toBeNull();
  });

  it('collapses once one toast or fewer is left, as upstream does, and runs its time again', async () => {
    await show();
    await raise(() => toast('One'));
    const id = await raise(() => toast('Two'));
    await fireEvent(around('Two', 'onTouchStart'), 'touchStart');
    await fireEvent(around('Two', 'onTouchEnd'), 'touchEnd');

    await act(async () => {
      toast.dismiss(id);
    });
    await elapse(3_000 + MOTION_MS);

    expect(screen.queryByText('One')).toBeNull();
  });

  it('removes a toast at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await show();
    const id = await raise(() => toast('Saved'));

    await act(async () => {
      toast.dismiss(id);
    });
    await elapse(20);

    expect(screen.queryByText('Saved')).toBeNull();
  });

  it("draws the toast in the popover's colours, rounded as the style's toast slot says", async () => {
    await show();
    await raise(() => toast('Saved', { testId: 'toast' }));

    expect(emittedClasses(screen.getByTestId('toast').props.className)).toEqual(
      expect.arrayContaining(['bg-popover', 'border', 'rounded-2xl']),
    );
  });
});
