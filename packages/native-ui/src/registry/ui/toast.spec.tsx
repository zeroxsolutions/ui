import { PortalHost } from '@rn-primitives/portal';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { Text } from './text';
import { Toaster, createToastManager, toast, useToastManager, type ToastProviderProps } from './toast';

const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

/** Long enough for a toast to come in or go out. */
const MOTION_MS = 600;

async function show(props: Omit<ToastProviderProps, 'children'> = {}): Promise<void> {
  await render(
    <>
      <Toaster {...props} />
      <PortalHost />
    </>,
  );
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

/** The nearest element above `element`, or itself, whose prop `name` is set. */
function around(element: ReturnType<typeof screen.getByText>, name: string) {
  let at: typeof element | null = element;
  while (at && at.props[name] === undefined) at = at.parent;
  return at;
}

/** The view a finger swipes: the toast holding `title`. */
function toastHolding(title: string) {
  const view = around(screen.getByText(title), 'onResponderGrant');
  if (!view) throw new Error(`No swipeable toast holds ${title}`);
  return view;
}

/** How far the layer that moves the toast holding `title` has moved it down, as its animated style says. */
function lift(title: string): number | undefined {
  let at = screen.getByText(title).parent;
  while (at && at.props.jestAnimatedStyle === undefined) at = at.parent;
  if (at) {
    const transform = (getAnimatedStyle(at) as { transform?: Record<string, number>[] }).transform ?? [];
    return transform.find((entry) => 'translateY' in entry)?.translateY;
  }
  throw new Error('No moving layer');
}

async function swipe(title: string, dx: number, dy: number) {
  const view = toastHolding(title);
  await fireEvent(view, 'responderGrant', { nativeEvent: { pageX: 0, pageY: 0, timestamp: 0 } });
  await fireEvent(view, 'responderMove', { nativeEvent: { pageX: dx, pageY: dy, timestamp: 400 } });
  await fireEvent(view, 'responderRelease', { nativeEvent: { pageX: dx, pageY: dy, timestamp: 800 } });
}

function Listed() {
  const { toasts } = useToastManager();
  return (
    <Text testID="listed">
      {toasts.map((entry) => `${String(entry.title)}${entry.limited ? ' (limited)' : ''}`).join(', ')}
    </Text>
  );
}

describe('Toaster', () => {
  let announce: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await act(async () => {
      toast.close();
    });
    await elapse(MOTION_MS);
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('draws a toast added to the manager, with its title and description', async () => {
    await show();

    await raise(() => toast.add({ title: 'Event created', description: 'Sunday, December 3 at 9:00 AM' }));

    expect(screen.getByText('Event created')).toBeOnTheScreen();
    expect(screen.getByText('Sunday, December 3 at 9:00 AM')).toBeOnTheScreen();
  });

  it('announces a new toast politely on iOS, and draws in a polite live region for Android', async () => {
    await show();

    await raise(() => toast.add({ title: 'Event created', description: 'Sunday, December 3 at 9:00 AM' }));

    expect(Platform.OS).toBe('ios');
    expect(announce).toHaveBeenCalledWith('Event created, Sunday, December 3 at 9:00 AM', { queue: true });
    expect(around(screen.getByText('Event created'), 'aria-live')).toHaveProp('aria-live', 'polite');
  });

  it('announces a high priority toast at once on iOS, and assertively for Android', async () => {
    await show();

    await raise(() => toast.add({ title: 'Connection lost', priority: 'high' }));

    expect(announce).toHaveBeenCalledWith('Connection lost', { queue: false });
    expect(around(screen.getByText('Connection lost'), 'aria-live')).toHaveProp('aria-live', 'assertive');
  });

  it('closes after five seconds by default, reporting the close and then the removal', async () => {
    const onClose = jest.fn();
    const onRemove = jest.fn();
    await show();
    await raise(() => toast.add({ title: 'Saved', onClose, onRemove }));

    await elapse(4_000);
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    await elapse(1_000);
    expect(onClose).toHaveBeenCalledTimes(1);
    await elapse(MOTION_MS);

    expect(screen.queryByText('Saved')).toBeNull();
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("takes the provider's timeout, a toast's own over it, and keeps up a toast whose timeout is 0", async () => {
    await show({ timeout: 1_000 });
    await raise(() => toast.add({ title: 'Short' }));
    await raise(() => toast.add({ title: 'Long', timeout: 3_000 }));
    await raise(() => toast.add({ title: 'Kept', timeout: 0 }));

    await elapse(1_000);
    expect(screen.queryByText('Short')).toBeNull();
    expect(screen.getByText('Long')).toBeOnTheScreen();
    await elapse(3_000);

    expect(screen.queryByText('Long')).toBeNull();
    expect(screen.getByText('Kept')).toBeOnTheScreen();
  });

  it('closes the toast with an id, and every toast without one', async () => {
    await show();
    const first = await raise(() => toast.add({ title: 'One', timeout: 0 }));
    await raise(() => toast.add({ title: 'Two', timeout: 0 }));
    await raise(() => toast.add({ title: 'Three', timeout: 0 }));

    await raise(() => toast.close(first));
    expect(screen.queryByText('One')).toBeNull();
    expect(screen.getByText('Two')).toBeOnTheScreen();

    await raise(() => toast.close());
    expect(screen.queryByText('Two')).toBeNull();
    expect(screen.queryByText('Three')).toBeNull();
  });

  it('updates a toast in place, by update or by adding with its id', async () => {
    await show();
    const id = await raise(() => toast.add({ title: 'Uploading', timeout: 0 }));

    await raise(() => toast.update(id, { title: 'Uploaded' }));
    expect(screen.queryByText('Uploading')).toBeNull();
    expect(screen.getByText('Uploaded')).toBeOnTheScreen();

    await raise(() => toast.update(id, (previous) => ({ description: `${String(previous.title)} 3 files` })));
    expect(screen.getByText('Uploaded 3 files')).toBeOnTheScreen();

    await raise(() => toast.add({ id, title: 'Uploaded again' }));
    expect(screen.getAllByText(/Uploaded/)).toHaveLength(2);
    expect(screen.getByText('Uploaded again')).toBeOnTheScreen();
  });

  it("follows a promise from its loading toast, kept up with a spinner, to its result's", async () => {
    await show();
    let resolve: (value: { name: string }) => void = () => undefined;
    const pending = new Promise<{ name: string }>((settle) => {
      resolve = settle;
    });

    // Not handed back to `raise`, which would wait on the promise.
    await raise(() => {
      void toast.promise(pending, {
        loading: 'Creating event...',
        success: (data) => `${data.name} created.`,
        error: 'Could not create event.',
      });
    });
    await elapse(10_000);
    expect(screen.getByText('Creating event...')).toBeOnTheScreen();
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();

    await raise(() => resolve({ name: 'Event' }));

    expect(screen.getByText('Event created.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Loading')).toBeNull();
  });

  it('shows the error of a promise that fails', async () => {
    await show();
    const failing = Promise.reject(new Error('offline'));

    await raise(() => {
      toast
        .promise(failing, {
          loading: 'Creating event...',
          success: 'Created.',
          error: (error: Error) => ({ title: 'Could not create event.', description: error.message }),
        })
        .catch(() => undefined);
    });
    await elapse(0);

    expect(screen.getByText('Could not create event.')).toBeOnTheScreen();
    expect(screen.getByText('offline')).toBeOnTheScreen();
  });

  it('draws its action as a button that runs the action', async () => {
    const onPress = jest.fn();
    await show();
    await raise(() => toast.add({ title: 'Event created', actionProps: { children: 'Undo', onPress } }));

    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('closes from its close button', async () => {
    await show();
    await raise(() => toast.add({ title: 'Saved', timeout: 0 }));

    await fireEvent.press(screen.getByRole('button', { name: 'Close toast' }));
    await elapse(MOTION_MS);

    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('lists its toasts through useToastManager, newest first, those past the limit marked limited', async () => {
    await render(
      <>
        <Toaster limit={2}>
          <Listed />
        </Toaster>
        <PortalHost />
      </>,
    );

    for (const title of ['One', 'Two', 'Three']) await raise(() => toast.add({ title, timeout: 0 }));

    expect(screen.getByTestId('listed')).toHaveTextContent('Three, Two, One (limited)');
    const oldest = screen.getByText('One', { includeHiddenElements: true });
    expect(oldest).not.toBeVisible();
  });

  it('adds through useToastManager to its own manager', async () => {
    const manager = createToastManager();
    function Adds() {
      const { add } = useToastManager();
      return (
        <Text role="button" onPress={() => add({ title: 'From the hook', timeout: 0 })}>
          Add
        </Text>
      );
    }
    await render(
      <>
        <Toaster toastManager={manager}>
          <Adds />
        </Toaster>
        <PortalHost />
      </>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    await elapse(MOTION_MS);

    expect(screen.getByText('From the hook')).toBeOnTheScreen();
    await raise(() => manager.close());
  });

  it('goes on a swipe down or right, and springs back from a swipe up', async () => {
    await show();
    await raise(() => toast.add({ title: 'Saved', timeout: 0 }));

    await swipe('Saved', 0, -80);
    await elapse(MOTION_MS);
    expect(screen.getByText('Saved')).toBeOnTheScreen();
    expect(lift('Saved')).toBe(0);

    await swipe('Saved', 0, 60);
    await elapse(MOTION_MS);
    expect(screen.queryByText('Saved')).toBeNull();

    await raise(() => toast.add({ title: 'Moved', timeout: 0 }));
    await swipe('Moved', 60, 0);
    await elapse(MOTION_MS);
    expect(screen.queryByText('Moved')).toBeNull();
  });

  it('stops its time while the stack is touched', async () => {
    await show();
    await raise(() => toast.add({ title: 'Saved' }));

    await fireEvent(toastHolding('Saved'), 'touchStart');
    await elapse(10_000);

    expect(screen.getByText('Saved')).toBeOnTheScreen();
  });

  it('keeps a toast added again by its id while it goes out', async () => {
    const onRemove = jest.fn();
    await show();
    const id = await raise(() => toast.add({ title: 'Saved', timeout: 0, onRemove }));

    await act(async () => {
      toast.close(id);
    });
    await elapse(100);
    await raise(() => toast.add({ id, title: 'Saved again', timeout: 0, onRemove }));
    await elapse(MOTION_MS);

    expect(screen.getByText('Saved again')).toBeOnTheScreen();
    expect(onRemove).not.toHaveBeenCalled();
    expect(lift('Saved again')).toBe(0);
  });

  it('stops its time while focus is in the stack, and runs it again once focus leaves', async () => {
    await show();
    await raise(() => toast.add({ title: 'Saved' }));
    const viewport = around(screen.getByText('Saved'), 'onFocus');
    if (!viewport) throw new Error('No viewport takes focus');

    await fireEvent(viewport, 'focus');
    await elapse(10_000);
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await fireEvent(viewport, 'blur', { nativeEvent: { relatedTarget: null } });
    await elapse(5_000 + MOTION_MS);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('removes a toast at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await show();
    const id = await raise(() => toast.add({ title: 'Saved' }));

    await act(async () => {
      toast.close(id);
    });
    await elapse(20);

    expect(screen.queryByText('Saved')).toBeNull();
  });

  describe('on the web', () => {
    type KeyListener = (event: { key: string; target?: unknown }) => void;
    let listeners: KeyListener[];

    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'web');
      listeners = [];
      // The keydown listener goes on the page's document, which React Native's jest environment has none of.
      Object.assign(globalThis, {
        document: {
          addEventListener: (_type: string, listener: KeyListener) => listeners.push(listener),
          removeEventListener: (_type: string, listener: KeyListener) => {
            listeners = listeners.filter((entry) => entry !== listener);
          },
        },
      });
    });

    afterEach(() => {
      delete (globalThis as { document?: unknown }).document;
    });

    async function press(key: string, target?: unknown): Promise<void> {
      await act(async () => {
        for (const listener of listeners) listener({ key, target });
      });
    }

    /**
     * A spy on `focus` of every View, which React Native's jest environment draws as one class whose `focus` is
     * already a mock; its calls from earlier tests are cleared.
     */
    async function spyOnFocus(): Promise<jest.SpyInstance> {
      let probe: object | null = null;
      await render(
        <View
          ref={(node) => {
            probe = node;
          }}
        />,
      );
      if (probe === null) throw new Error('No View to read the class from');
      return jest.spyOn(Object.getPrototypeOf(probe) as { focus: () => void }, 'focus').mockClear();
    }

    it('moves focus to the stack with F6 while a toast is shown, and leaves it where it is with none', async () => {
      const focus = await spyOnFocus();
      await show();
      await raise(() => toast.add({ id: 'saved', title: 'Saved', timeout: 0 }));

      await press('F6');
      expect(focus).toHaveBeenCalledTimes(1);

      await act(async () => {
        toast.close('saved');
      });
      await elapse(MOTION_MS);
      await press('F6');
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('leaves focus alone on F6 pressed in the stack itself', async () => {
      const focus = await spyOnFocus();
      await show();
      await raise(() => toast.add({ title: 'Saved', timeout: 0 }));
      await press('F6');
      const [stack] = focus.mock.contexts;

      await press('F6', stack);

      expect(focus).toHaveBeenCalledTimes(1);
    });
  });
});
