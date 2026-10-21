import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
} from './alert-dialog';
import { Button } from './button';
import { catchBackPress, followAccessibilityFocus } from './overlay.testing';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open dialog from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

function DeleteAccount({ onDelete, ...props }: AlertDialogProps & { onDelete?: () => void }) {
  return (
    <>
      <AlertDialog {...props}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Delete account</Text>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent testID="content">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={onDelete}>
              <Text>Continue</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Delete account' });
/**
 * The open dialog's content. It is not one accessibility element, so that a screen reader reaches each
 * control in it, and a role query finds only those; its role is read off its props.
 */
const alertDialog = () => screen.getByTestId('content');

/** The dimmed backdrop behind the open dialog, which a press outside the content lands on. */
function overlay() {
  const centre = alertDialog().parent?.parent;
  const backdrop = centre?.parent?.children.find((child) => child !== centre);
  if (backdrop === undefined || typeof backdrop === 'string') throw new Error('The alert dialog has no overlay');
  return backdrop;
}

describe('AlertDialog', () => {
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

  it('draws nothing until its trigger is pressed', async () => {
    await render(<DeleteAccount />);

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a modal alertdialog named by its title when the trigger is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount />);

    await user.press(trigger());
    await finishMotion();

    expect(alertDialog()).toHaveProp('role', 'alertdialog');
    expect(alertDialog()).toHaveProp('aria-modal', true);
    expect(screen.getByRole('heading', { name: 'Are you absolutely sure?' })).toHaveProp(
      'nativeID',
      alertDialog().props['aria-labelledby'],
    );
    expect(trigger()).toBeExpanded();
  });

  it('stays open on a press outside its content, on the overlay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount defaultOpen />);
    await finishMotion();

    await user.press(overlay());
    await finishMotion();

    expect(alertDialog()).toBeOnTheScreen();
  });

  it('closes from its cancel button and reports it through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount defaultOpen onOpenChange={onOpenChange} />);
    await finishMotion();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await finishMotion();

    expect(onOpenChange.mock.calls).toEqual([[false]]);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('runs its action and stays open, as upstream leaves closing to the caller', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount defaultOpen onDelete={onDelete} />);
    await finishMotion();

    await user.press(screen.getByRole('button', { name: 'Continue' }));
    await finishMotion();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(alertDialog()).toBeOnTheScreen();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    await render(<DeleteAccount defaultOpen />);
    await finishMotion();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await render(<DeleteAccount defaultOpen />);
    await finishMotion();

    await act(async () => {
      alertDialog().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the content as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount />);

    await user.press(trigger());
    await finishMotion();
    expect(focused()).toBe('content');

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('fades in over 100ms as it opens, and stays drawn while it fades out', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount />);

    await user.press(trigger());
    await elapse(50);
    const fade = alertDialog().parent?.parent?.parent;
    if (!fade) throw new Error('The alert dialog has no fade');
    expect(fade).not.toHaveAnimatedStyle({ opacity: 0 });
    expect(fade).not.toHaveAnimatedStyle({ opacity: 1 });
    await elapse(100);
    expect(fade).toHaveAnimatedStyle({ opacity: 1 });

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await elapse(50);
    expect(alertDialog()).toBeOnTheScreen();
    await elapse(100);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<DeleteAccount />);
    await elapse(0);

    await user.press(trigger());
    await elapse(16);
    expect(alertDialog().parent?.parent?.parent).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('content')).toBeNull();
  });
});
