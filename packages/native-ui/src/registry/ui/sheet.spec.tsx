import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Button } from './button';
import { catchBackPress, followAccessibilityFocus } from './overlay.testing';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
  type SheetProps,
} from './sheet';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open sheet from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

function EditProfile({
  side,
  withHost = true,
  ...props
}: SheetProps & Pick<SheetContentProps, 'side'> & { withHost?: boolean }) {
  return (
    <>
      <Sheet {...props}>
        <SheetTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Open</Text>
          </Button>
        </SheetTrigger>
        <SheetContent side={side} testID="content">
          <SheetHeader>
            <SheetTitle>Edit profile</SheetTitle>
            <SheetDescription>Make changes to your profile here.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">
                <Text>Cancel</Text>
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {withHost && <PortalHost />}
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Open' });
/**
 * The open sheet's content. It is not one accessibility element, so that a screen reader reaches each
 * control in it, and a role query finds only those; its role is read off its props.
 */
const sheet = () => screen.getByTestId('content');
/** The layer that slides the content in from its side. */
const slide = () => sheet().parent;

/** The dimmed backdrop behind the open sheet, which a press outside the content lands on. */
function overlay() {
  const fade = slide()?.parent?.children[0];
  const backdrop = typeof fade === 'object' ? fade?.children[0] : undefined;
  if (backdrop === undefined || typeof backdrop === 'string') throw new Error('The sheet has no overlay');
  return backdrop;
}

describe('Sheet', () => {
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
  const finishMotion = () => elapse(400);

  it('draws no sheet until its trigger is pressed', async () => {
    await render(<EditProfile />);

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a modal dialog named by its title when the trigger is pressed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);

    await user.press(trigger());
    await finishMotion();

    expect(sheet()).toHaveProp('role', 'dialog');
    expect(sheet()).toHaveProp('aria-modal', true);
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toHaveProp(
      'nativeID',
      sheet().props['aria-labelledby'],
    );
    expect(trigger()).toBeExpanded();
  });

  it('closes on a press outside its content, on the overlay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await user.press(overlay());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes from its close buttons and reports it through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile defaultOpen onOpenChange={onOpenChange} />);
    await finishMotion();

    await user.press(screen.getByLabelText('Close'));
    await finishMotion();
    await user.press(trigger());
    await finishMotion();
    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await finishMotion();

    expect(onOpenChange.mock.calls).toEqual([[false], [true], [false]]);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await render(<EditProfile defaultOpen />);
    await finishMotion();

    await act(async () => {
      sheet().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the content as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);

    await user.press(trigger());
    await finishMotion();
    expect(focused()).toBe('content');

    await user.press(screen.getByLabelText('Close'));
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it.each([
    ['right', ['right-0', 'inset-y-0', 'w-3/4']],
    ['left', ['left-0', 'inset-y-0', 'w-3/4']],
    ['top', ['top-0', 'inset-x-0']],
    ['bottom', ['bottom-0', 'inset-x-0']],
  ] as const)('attaches the panel to the %s edge', async (side, edge) => {
    await render(<EditProfile side={side} defaultOpen />);

    for (const style of ['vega', 'nova'] as const) {
      expect(emittedClasses(sheet().props.className, style)).toEqual(expect.arrayContaining(['absolute', ...edge]));
    }
  });

  it.each([
    ['right', { translateX: 1 }],
    ['left', { translateX: -1 }],
    ['bottom', { translateY: 1 }],
    ['top', { translateY: -1 }],
  ] as const)('slides in from the %s over 200ms, and stays drawn while it slides out', async (side, direction) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile side={side} />);

    await user.press(trigger());
    await elapse(100);
    const [axis, sign] = Object.entries(direction)[0];
    const midway = slide()?.props.jestAnimatedStyle?.value.transform?.[0]?.[axis] as number;
    expect(Math.sign(midway)).toBe(sign);
    expect(Math.abs(midway)).toBeLessThan(40);
    await elapse(150);
    expect(slide()).toHaveAnimatedStyle({ opacity: 1, transform: [{ [axis]: 0 }] });

    await user.press(screen.getByLabelText('Close'));
    await elapse(100);
    expect(sheet()).toBeOnTheScreen();
    await elapse(150);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile />);
    await elapse(0);

    await user.press(trigger());
    await elapse(16);
    expect(sheet()).toBeVisible();

    await user.press(screen.getByLabelText('Close'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<EditProfile withHost={false} />);

    await user.press(trigger());
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^Sheet opened, but no <PortalHost \/>/));
  });
});
