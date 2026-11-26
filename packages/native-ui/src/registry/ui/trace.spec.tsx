import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { CircleCheck, Globe } from 'lucide-react-native';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { Icon } from './icon';
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from './trace';
import { Text } from './text';

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
}

/** A step that ran a command, whose output its trigger shows. */
function Step({ status, defaultOpen }: { status?: 'error'; defaultOpen?: boolean }) {
  return (
    <Trace>
      <TraceCollapsible defaultOpen={defaultOpen}>
        <TraceCollapsibleTrigger testID="trigger">
          <TraceLine status={status}>
            <TraceIcon testID="status-icon">
              <Icon as={CircleCheck} />
            </TraceIcon>
            <TraceTitle>Ran pnpm --version</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent testID="content">
          <Text>10.18.0</Text>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

const triggerOf = () => screen.getByRole('button', { name: 'Ran pnpm --version' });

/** The view the content is clipped in, whose height grows and shrinks. */
const clipOf = () => screen.getByTestId('content', { includeHiddenElements: true }).parent;

/** Lays the content out at `height`, as a device does once it is drawn. */
async function layOut(height: number): Promise<void> {
  // The box around the inner one, which holds the inner box's margins.
  const measured = screen.getByText('10.18.0', { includeHiddenElements: true }).parent?.parent;
  await fireEvent(measured!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height } } });
}

describe('Trace', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads a step as its title, with its icon hidden from screen readers', async () => {
    reduceMotion(false);
    await render(
      <Trace>
        <TraceLine>
          <TraceIcon testID="icon">
            <Icon as={Globe} />
          </TraceIcon>
          <TraceTitle>Searched the web</TraceTitle>
          <TraceDescription>2s</TraceDescription>
        </TraceLine>
      </Trace>,
    );

    expect(screen.getByText('Searched the web')).toBeVisible();
    expect(screen.getByText('2s')).toBeVisible();
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(screen.getByTestId('icon', { includeHiddenElements: true })).toBeTruthy();
  });

  describe('a running step', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
    const titleView = () => screen.getByText('Thinking').parent;

    function Running({ status }: { status?: 'running' }) {
      return (
        <Trace>
          <TraceLine status={status}>
            <TraceTitle>Thinking</TraceTitle>
          </TraceLine>
        </Trace>
      );
    }

    it('pulses its title', async () => {
      reduceMotion(false);
      await render(<Running status="running" />);

      await elapse(1000);
      expect(titleView()).toHaveAnimatedStyle({ opacity: 0.5 });
      await elapse(1000);
      expect(titleView()).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('holds its title still when the person asked to reduce motion, and once it is done', async () => {
      reduceMotion(true);
      await render(<Running status="running" />);
      await elapse(1000);
      expect(StyleSheet.flatten(titleView()?.props.style)?.opacity).toBeUndefined();

      reduceMotion(false);
      await screen.rerender(<Running />);
      await elapse(1000);
      expect(StyleSheet.flatten(titleView()?.props.style)?.opacity).toBeUndefined();
    });
  });

  describe('a collapsible step', () => {
    it('has a trigger announced as a collapsed button named by its line, and no output while closed', async () => {
      reduceMotion(false);
      await render(<Step />);

      expect(triggerOf()).toBeCollapsed();
      expect(screen.queryByText('10.18.0')).toBeNull();
    });

    it('shows the output when the trigger is pressed and hides it on a second press', async () => {
      reduceMotion(true);
      const user = userEvent.setup();
      await render(<Step />);
      await act(async () => {});

      await user.press(triggerOf());
      expect(triggerOf()).toBeExpanded();
      expect(screen.getByText('10.18.0')).toBeVisible();

      await user.press(triggerOf());
      expect(triggerOf()).toBeCollapsed();
      expect(screen.queryByText('10.18.0', { includeHiddenElements: true })).toBeNull();
    });

    it('draws text passed straight to the content', async () => {
      reduceMotion(false);
      await render(
        <TraceCollapsible defaultOpen>
          <TraceCollapsibleTrigger>
            <TraceLine>
              <TraceTitle>Ran node --version</TraceTitle>
            </TraceLine>
          </TraceCollapsibleTrigger>
          <TraceCollapsibleContent>v24.18.0</TraceCollapsibleContent>
        </TraceCollapsible>,
      );

      expect(screen.getByText('v24.18.0')).toBeVisible();
    });

    it('is open from the start with defaultOpen', async () => {
      reduceMotion(false);
      await render(<Step defaultOpen />);

      expect(triggerOf()).toBeExpanded();
      expect(screen.getByText('10.18.0')).toBeVisible();
    });

    it('follows a controlled open and reports presses through onOpenChange', async () => {
      reduceMotion(true);
      const onOpenChange = jest.fn();
      function Controlled() {
        const [open, setOpen] = useState(true);
        return (
          <TraceCollapsible
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              onOpenChange(next);
            }}
          >
            <TraceCollapsibleTrigger>
              <TraceLine>
                <TraceTitle>Thought for 5s</TraceTitle>
              </TraceLine>
            </TraceCollapsibleTrigger>
            <TraceCollapsibleContent>
              <Text>CI installs with a frozen lockfile.</Text>
            </TraceCollapsibleContent>
          </TraceCollapsible>
        );
      }
      const user = userEvent.setup();
      await render(<Controlled />);
      await act(async () => {});

      expect(screen.getByText('CI installs with a frozen lockfile.')).toBeVisible();

      await user.press(screen.getByRole('button', { name: 'Thought for 5s' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByText('CI installs with a frozen lockfile.', { includeHiddenElements: true })).toBeNull();
    });

    describe('motion', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
      /** The view the chevron turns in, after the line in the trigger. */
      const chevronTurn = () => screen.getByTestId('trigger').children[1] as ReturnType<typeof screen.getByTestId>;

      it('grows the output from no height to its own over 200ms, turning the chevron to point down', async () => {
        reduceMotion(false);
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await render(<Step />);

        await user.press(triggerOf());
        await layOut(80);
        await elapse(100);

        expect(clipOf()).not.toHaveAnimatedStyle({ height: 0 });
        expect(clipOf()).not.toHaveAnimatedStyle({ height: 80 });

        await elapse(150);

        expect(clipOf()).toHaveAnimatedStyle({ height: 80 });
        expect(chevronTurn()).toHaveAnimatedStyle({ transform: [{ rotate: '90deg' }] });
      });

      it('shrinks the output to no height over 200ms when it closes, then removes it', async () => {
        reduceMotion(false);
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await render(<Step defaultOpen />);
        await layOut(80);

        await user.press(triggerOf());
        await elapse(100);

        expect(triggerOf()).toBeCollapsed();
        expect(screen.getByText('10.18.0', { includeHiddenElements: true })).not.toBeVisible();
        expect(clipOf()).not.toHaveAnimatedStyle({ height: 80 });

        await elapse(150);

        expect(screen.queryByText('10.18.0', { includeHiddenElements: true })).toBeNull();
        expect(chevronTurn()).toHaveAnimatedStyle({ transform: [{ rotate: '0deg' }] });
      });

      it('opens at once when the system asks for reduced motion', async () => {
        reduceMotion(true);
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        await render(<Step />);
        await act(async () => {});

        await user.press(triggerOf());
        await layOut(80);
        await elapse(16);

        expect(clipOf()).toHaveAnimatedStyle({ height: 80 });
        expect(chevronTurn()).toHaveAnimatedStyle({ transform: [{ rotate: '90deg' }] });
      });
    });
  });
});
