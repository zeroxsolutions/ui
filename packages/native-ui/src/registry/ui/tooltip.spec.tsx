import { PortalHost } from '@rn-primitives/portal';
import { act, configure, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, View } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { Button } from './button';
import { catchBackPress, followAccessibilityFocus } from './overlay.testing';
import { Text } from './text';
import { Tooltip, TooltipContent, TooltipTrigger, type TooltipContentProps } from './tooltip';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open tooltip from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

/** Where a device lays the trigger out on the screen: 100px wide and 40px tall, its top left at (50, 200). */
const TRIGGER = { x: 50, y: 200, width: 100, height: 40 };

function AddToLibrary({ withHost = true, ...props }: Omit<TooltipContentProps, 'children'> & { withHost?: boolean }) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" testID="trigger">
            <Text>Hover</Text>
          </Button>
        </TooltipTrigger>
        <TooltipContent testID="content" {...props}>
          <Text>Add to library</Text>
        </TooltipContent>
      </Tooltip>
      {withHost && <PortalHost />}
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Hover' });
/** The open tooltip's content, whose role is read off its props as it is not one accessibility element. */
const tooltip = () => screen.getByTestId('content');
/** The layer inside the content that fades, grows and slides. */
const motionLayer = () => tooltip().children[0] as ReturnType<typeof screen.getByTestId>;

/** The layer behind the content that a press outside it lands on. */
function outside() {
  const layer = tooltip().parent?.children[0];
  if (layer === undefined || typeof layer === 'string') throw new Error('The tooltip has no outside layer');
  return layer;
}

/** Reports where a device lays out the trigger; Jest lays nothing out. */
function layOutTrigger() {
  jest
    .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
    .mockImplementation((callback) => callback(0, 0, TRIGGER.width, TRIGGER.height, TRIGGER.x, TRIGGER.y));
}

async function layOutContent(width: number, height: number) {
  await act(async () => {
    tooltip().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  });
}

describe('Tooltip', () => {
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

  async function open(props: Omit<TooltipContentProps, 'children'> = {}) {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AddToLibrary {...props} />);
    await user.press(trigger());
    await finishMotion();
    return user;
  }

  it('draws no tooltip until its trigger is pressed', async () => {
    await render(<AddToLibrary />);

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a tooltip holding its label when the trigger is pressed', async () => {
    await open();

    expect(tooltip()).toHaveProp('role', 'tooltip');
    expect(tooltip()).toHaveTextContent('Add to library');
  });

  it('closes when its trigger is pressed again, staying drawn while it goes out', async () => {
    const user = await open();

    await user.press(trigger());
    await elapse(16);
    expect(tooltip()).toBeOnTheScreen();
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('closes on a press outside it', async () => {
    const user = await open();

    await user.press(outside());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
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
      tooltip().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the tooltip as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = await open();
    expect(focused()).toBe('content');

    await user.press(trigger());
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('opens 4px above its trigger, centred on it', async () => {
    await open();
    await layOutContent(120, 30);

    expect(tooltip()).toHaveStyle({ top: TRIGGER.y - 4 - 30, left: TRIGGER.x + TRIGGER.width / 2 - 60 });
  });

  it('opens below its trigger when its side is bottom', async () => {
    await open({ side: 'bottom' });
    await layOutContent(120, 30);

    expect(tooltip()).toHaveStyle({ top: TRIGGER.y + TRIGGER.height + 4 });
  });

  it.each([
    ['top', { side: 'top' }, 1],
    ['bottom', { side: 'bottom' }, -1],
  ] as const)('slides in toward its trigger when it opens on the %s', async (_side, props, direction) => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AddToLibrary {...props} />);

    await user.press(trigger());
    await elapse(16);
    const [slide, grow] = getAnimatedStyle(motionLayer()).transform as [{ translateY: number }, { scale: number }];
    expect(Math.sign(slide.translateY)).toBe(direction);
    expect(grow.scale).toBeLessThan(1);
    await finishMotion();
    expect(motionLayer()).toHaveAnimatedStyle({ opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] });
  });

  it('appears at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AddToLibrary />);
    await elapse(0);

    await user.press(trigger());
    expect(motionLayer()).not.toHaveAnimatedStyle({ opacity: 0 });

    await user.press(trigger());
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AddToLibrary withHost={false} />);

    await user.press(trigger());
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^Tooltip opened, but no <PortalHost \/>/));
  });
});
