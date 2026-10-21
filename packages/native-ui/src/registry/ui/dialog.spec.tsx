import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import type * as ReactNative from 'react-native';
import { AccessibilityInfo, BackHandler, type NativeEventSubscription } from 'react-native';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
} from './dialog';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open dialog from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

function EditProfile(props: DialogProps) {
  return (
    <>
      <Dialog {...props}>
        <DialogTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Edit profile</Text>
          </Button>
        </DialogTrigger>
        <DialogContent testID="content">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Make changes to your profile here.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button>
              <Text>Save changes</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Edit profile' });
/**
 * The open dialog's content. It is not one accessibility element, so that a screen reader reaches each
 * control in it, and a role query finds only those; its role is read off its props.
 */
const dialog = () => screen.getByTestId('content');

/** The dimmed backdrop behind the open dialog, which a press outside the content lands on. */
function overlay() {
  const centre = dialog().parent?.parent;
  const backdrop = centre?.parent?.children.find((child) => child !== centre);
  if (backdrop === undefined || typeof backdrop === 'string') throw new Error('The dialog has no overlay');
  return backdrop;
}

describe('Dialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets `ms` pass on Jest's clock, running the animation frames and timers due in it. */
  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(300);

  it('draws no dialog until its trigger is pressed', async () => {
    await render(<EditProfile />);

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a modal dialog named by its title when the trigger is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);

    await user.press(trigger());
    await finishMotion();

    expect(dialog()).toHaveProp('role', 'dialog');
    expect(dialog()).toHaveProp('aria-modal', true);
    expect(screen.getByRole('heading', { name: 'Profile' })).toHaveProp('nativeID', dialog().props['aria-labelledby']);
    expect(screen.getByText('Make changes to your profile here.')).toBeOnTheScreen();
    expect(trigger()).toBeExpanded();
  });

  it('opens at first with defaultOpen, and reports each change through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen onOpenChange={onOpenChange} />);
    await finishMotion();

    expect(dialog()).toBeOnTheScreen();
    await user.press(screen.getByLabelText('Close'));

    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it('closes on a press outside its content, on the overlay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await user.press(overlay());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('stays open on a press inside its content', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await user.press(screen.getByText('Make changes to your profile here.'));
    await finishMotion();

    expect(dialog()).toBeOnTheScreen();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const handlers: Parameters<typeof BackHandler.addEventListener>[1][] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler): NativeEventSubscription => {
      handlers.push(handler);
      return { remove: () => undefined };
    });
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    let handled: boolean | undefined;
    await act(async () => {
      handled = handlers.at(-1)?.({ type: 'hardwareBackPress', timeStamp: 0 });
    });
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await act(async () => {
      dialog().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes from its close buttons', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await user.press(screen.getByText('Close'));
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();

    await user.press(trigger());
    await finishMotion();
    await user.press(screen.getByLabelText('Close'));
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the content as it opens, and back to the trigger as it closes', async () => {
    // Jest's renderer has no native tags, so each view is given one; the primitives focus a view by its tag.
    const views: unknown[] = [];
    const tagOf: typeof ReactNative.findNodeHandle = (view) =>
      views.includes(view) ? views.indexOf(view) : views.push(view) - 1;
    // react-native exports findNodeHandle through a getter, which a spy replaces only as a property.
    jest
      .spyOn(jest.requireActual<{ findNodeHandle: unknown }>('react-native'), 'findNodeHandle', 'get')
      .mockReturnValue(tagOf);
    const focus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus');
    const focused = () =>
      (views[focus.mock.lastCall?.[0] ?? -1] as { props: { testID?: string } } | undefined)?.props.testID;
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);

    await user.press(trigger());
    await finishMotion();
    expect(focused()).toBe('content');

    await user.press(screen.getByLabelText('Close'));
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('fades in over 100ms as it opens, and stays drawn while it fades out', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);

    await user.press(trigger());
    await elapse(50);
    const fade = screen.getByTestId('content').parent?.parent?.parent;
    if (!fade) throw new Error('The dialog has no fade');
    expect(fade).not.toHaveAnimatedStyle({ opacity: 0 });
    expect(fade).not.toHaveAnimatedStyle({ opacity: 1 });
    await elapse(100);
    expect(fade).toHaveAnimatedStyle({ opacity: 1 });

    await user.press(screen.getByLabelText('Close'));
    await elapse(50);
    expect(screen.getByTestId('content')).toBeTruthy();
    await elapse(100);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);
    await elapse(0);

    await user.press(trigger());
    await elapse(16);
    const fade = dialog().parent?.parent?.parent;
    expect(fade).toBeVisible();

    await user.press(screen.getByLabelText('Close'));
    expect(screen.queryByTestId('content')).toBeNull();
  });
});
