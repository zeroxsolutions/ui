import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, View } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { Button } from './button';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './popover';
import type { PopoverContentProps } from './popover';
import { catchBackPress, followAccessibilityFocus } from './overlay.testing';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open popover from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

/** Where a device lays the trigger out on the screen: 100px wide and 40px tall, its top left at (50, 200). */
const TRIGGER = { x: 50, y: 200, width: 100, height: 40 };

function Dimensions({ withHost = true, ...props }: Omit<PopoverContentProps, 'children'> & { withHost?: boolean }) {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Open popover</Text>
          </Button>
        </PopoverTrigger>
        <PopoverContent testID="content" {...props}>
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      {withHost && <PortalHost />}
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Open popover' });
/**
 * The open popover's content. It is not one accessibility element, so that a screen reader reaches each
 * control in it, and a role query finds only those; its role is read off its props.
 */
const popover = () => screen.getByTestId('content');
/** The layer inside the content that fades, grows and slides. */
const box = () => popover().children[0] as ReturnType<typeof screen.getByTestId>;

/** The layer behind the content that a press outside it lands on. */
function outside() {
  const layer = popover().parent?.children[0];
  if (layer === undefined || typeof layer === 'string') throw new Error('The popover has no outside layer');
  return layer;
}

/** Reports where a device lays out the trigger and the content; Jest lays nothing out. */
function layOutTrigger() {
  jest
    .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
    .mockImplementation((callback) => callback(0, 0, TRIGGER.width, TRIGGER.height, TRIGGER.x, TRIGGER.y));
}

async function layOutContent(width: number, height: number) {
  await act(async () => {
    popover().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

describe('Popover', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    layOutTrigger();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets `ms` pass on Jest's clock, running the animation frames and timers due in it. */
  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(300);

  async function open(props: Omit<PopoverContentProps, 'children'> = {}) {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Dimensions {...props} />);
    await user.press(trigger());
    await finishMotion();
    return user;
  }

  it('draws no popover until its trigger is pressed', async () => {
    await render(<Dimensions />);

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a dialog named by its title when the trigger is pressed', async () => {
    await open();

    expect(popover()).toHaveProp('role', 'dialog');
    expect(screen.getByRole('heading', { name: 'Dimensions' })).toHaveProp(
      'nativeID',
      popover().props['aria-labelledby'],
    );
    expect(trigger()).toBeExpanded();
  });

  it('closes when its trigger is pressed again', async () => {
    const user = await open();

    await user.press(trigger());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes on a press outside its content', async () => {
    const user = await open();

    await user.press(outside());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
    expect(trigger()).toBeCollapsed();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    await open();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await open();

    await act(async () => {
      popover().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the content as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = await open();
    expect(focused()).toBe('content');

    await user.press(outside());
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('opens 4px below its trigger, centred on it', async () => {
    await open();
    await layOutContent(200, 120);

    expect(popover()).toHaveStyle({ top: TRIGGER.y + TRIGGER.height + 4, left: TRIGGER.x + TRIGGER.width / 2 - 100 });
  });

  it('opens above its trigger when its side is top', async () => {
    await open({ side: 'top', sideOffset: 8 });
    await layOutContent(200, 120);

    expect(popover()).toHaveStyle({ top: TRIGGER.y - 8 - 120 });
  });

  it.each([
    ['bottom', { side: 'bottom' }, -1],
    ['top', { side: 'top' }, 1],
  ] as const)('slides in toward its trigger when it opens on the %s', async (_side, props, direction) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Dimensions {...props} />);

    await user.press(trigger());
    await elapse(16);
    const [slide, grow] = getAnimatedStyle(box()).transform as [{ translateY: number }, { scale: number }];
    expect(Math.sign(slide.translateY)).toBe(direction);
    expect(grow.scale).toBeLessThan(1);
    await finishMotion();
    expect(box()).toHaveAnimatedStyle({ opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] });
  });

  it('stays drawn while it goes out after closing', async () => {
    const user = await open();

    await user.press(outside());
    await elapse(16);
    expect(popover()).toBeOnTheScreen();
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Dimensions />);
    await elapse(0);

    await user.press(trigger());
    expect(box()).not.toHaveAnimatedStyle({ opacity: 0 });

    await user.press(outside());
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<Dimensions withHost={false} />);

    await user.press(trigger());
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^Popover opened, but no <PortalHost \/>/));
  });
});
