import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
} from './drawer';
import { catchBackPress, followAccessibilityFocus, swipe } from './overlay.testing';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open drawer from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

function MoveGoal(props: DrawerProps) {
  return (
    <>
      <Drawer {...props}>
        <DrawerTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Open Drawer</Text>
          </Button>
        </DrawerTrigger>
        <DrawerContent testID="content">
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">
                <Text>Cancel</Text>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <PortalHost />
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Open Drawer' });
/**
 * The open drawer's content. It is not one accessibility element, so that a screen reader reaches each
 * control in it, and a role query finds only those; its role is read off its props.
 */
const drawer = () => screen.getByTestId('content');
/** The layer that slides the content in from its edge. */
const slide = () => drawer().parent;

/** The dimmed backdrop behind the open drawer, which a press outside the content lands on. */
function overlay() {
  const fade = slide()?.parent?.children[0];
  const backdrop = typeof fade === 'object' ? fade?.children[0] : undefined;
  if (backdrop === undefined || typeof backdrop === 'string') throw new Error('The drawer has no overlay');
  return backdrop;
}

/**
 * Reports the size a device would lay the drawer out at; Jest lays nothing out. fireEvent would ask the
 * drawer's PanResponder whether it takes a touch first, with no touch, which it declines.
 */
async function layOut(width: number, height: number) {
  await act(async () => {
    drawer().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

describe('Drawer', () => {
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
  const finishMotion = () => elapse(600);

  it('draws no drawer until its trigger is pressed', async () => {
    await render(<MoveGoal />);

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a modal dialog named by its title when the trigger is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal />);

    await user.press(trigger());
    await finishMotion();

    expect(drawer()).toHaveProp('role', 'dialog');
    expect(drawer()).toHaveProp('aria-modal', true);
    expect(screen.getByRole('heading', { name: 'Move Goal' })).toHaveProp(
      'nativeID',
      drawer().props['aria-labelledby'],
    );
    expect(trigger()).toBeExpanded();
  });

  it('closes on a press outside its content, on the overlay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal defaultOpen />);
    await finishMotion();

    await user.press(overlay());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes from its close button and reports it through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal defaultOpen onOpenChange={onOpenChange} />);
    await finishMotion();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await finishMotion();

    expect(onOpenChange.mock.calls).toEqual([[false]]);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    await render(<MoveGoal defaultOpen />);
    await finishMotion();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await render(<MoveGoal defaultOpen />);
    await finishMotion();

    await act(async () => {
      drawer().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the content as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal />);

    await user.press(trigger());
    await finishMotion();
    expect(focused()).toBe('content');

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it.each([
    ['down', { dy: 150 }],
    ['up', { dy: -150 }],
    ['left', { dx: -150 }],
    ['right', { dx: 150 }],
  ] as const)('closes when swiped %s past a quarter of its size', async (swipeDirection, move) => {
    await render(<MoveGoal swipeDirection={swipeDirection} defaultOpen />);
    await finishMotion();
    await layOut(400, 400);

    await swipe(drawer(), move);
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes when flicked toward its edge, however short the swipe', async () => {
    await render(<MoveGoal defaultOpen />);
    await finishMotion();
    await layOut(400, 400);

    await swipe(drawer(), { dy: 40, ms: 50 });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('settles back open when swiped a short way and let go slowly', async () => {
    await render(<MoveGoal defaultOpen />);
    await finishMotion();
    await layOut(400, 400);

    await swipe(drawer(), { dy: 60, ms: 1_000 });
    await finishMotion();

    expect(drawer()).toBeOnTheScreen();
    expect(slide()).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });
  });

  it('stays open when swiped away from its edge', async () => {
    await render(<MoveGoal defaultOpen />);
    await finishMotion();
    await layOut(400, 400);

    await swipe(drawer(), { dy: -300 });
    await finishMotion();

    expect(drawer()).toBeOnTheScreen();
  });

  it.each([
    ['down', ['bottom-0', 'inset-x-0', 'rounded-t-xl', 'border-t']],
    ['up', ['top-0', 'inset-x-0', 'rounded-b-xl', 'border-b']],
    ['left', ['left-0', 'inset-y-0', 'w-3/4', 'rounded-r-xl', 'border-r']],
    ['right', ['right-0', 'inset-y-0', 'w-3/4', 'rounded-l-xl', 'border-l']],
  ] as const)('attaches a drawer swiped %s to that edge', async (swipeDirection, edge) => {
    await render(<MoveGoal swipeDirection={swipeDirection} defaultOpen />);

    for (const style of ['vega', 'nova'] as const) {
      expect(emittedClasses(drawer().props.className, style)).toEqual(expect.arrayContaining(['absolute', ...edge]));
    }
  });

  it('slides in from its edge as it opens, and stays drawn while it slides out', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal />);

    await user.press(trigger());
    await layOut(400, 300);
    await elapse(100);
    expect(slide()).not.toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });
    await elapse(400);
    expect(slide()).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await elapse(200);
    expect(drawer()).toBeOnTheScreen();
    await elapse(300);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<MoveGoal />);
    await elapse(0);

    await user.press(trigger());
    await elapse(16);
    expect(slide()).toHaveAnimatedStyle({ transform: [{ translateY: 0 }] });

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByTestId('content')).toBeNull();
  });
});
