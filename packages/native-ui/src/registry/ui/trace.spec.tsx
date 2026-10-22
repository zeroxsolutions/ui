import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { CircleCheck, Globe } from 'lucide-react-native';
import { useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
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

/** The classes of the trigger, whose colour its chevron is drawn in. */
const chevronClasses = () => emittedClasses(screen.getByTestId('trigger').props.className);

const triggerOf = () => screen.getByRole('button', { name: 'Ran pnpm --version' });

/** The view the content is clipped in, whose height grows and shrinks. */
const clipOf = () => screen.getByTestId('content', { includeHiddenElements: true }).parent;

/** Lays the content out at `height`, as a device does once it is drawn. */
async function layOut(height: number): Promise<void> {
  const inner = screen.getByText('10.18.0', { includeHiddenElements: true }).parent;
  await fireEvent(inner!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height } } });
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

  it('draws a failed step in the destructive colour and a pending one dimmed', async () => {
    reduceMotion(false);
    await render(
      <Trace>
        <TraceLine status="error" testID="failed">
          <TraceTitle>Failed to run pnpm install</TraceTitle>
        </TraceLine>
        <TraceLine status="pending" testID="pending">
          <TraceTitle>Run the tests</TraceTitle>
        </TraceLine>
      </Trace>,
    );

    expect(emittedClasses(screen.getByText('Failed to run pnpm install').props.className)).toContain(
      'text-destructive',
    );
    expect(emittedClasses(screen.getByText('Run the tests').props.className)).toContain('text-muted-foreground');
    expect(emittedClasses(screen.getByTestId('pending').props.className)).toContain('opacity-60');
    expect(emittedClasses(screen.getByTestId('failed').props.className)).not.toContain('opacity-60');
  });

  it('pulls an icon after the title back by a step, and not one before it', async () => {
    reduceMotion(false);
    await render(
      <Trace>
        <TraceLine>
          <TraceIcon testID="before">
            <Icon as={Globe} />
          </TraceIcon>
          <TraceTitle>pnpm.io</TraceTitle>
          <TraceIcon testID="after">
            <Icon as={Globe} />
          </TraceIcon>
        </TraceLine>
      </Trace>,
    );

    const classesOf = (testID: string) =>
      emittedClasses(screen.getByTestId(testID, { includeHiddenElements: true }).props.className);
    expect(classesOf('after')).toContain('-ml-1');
    expect(classesOf('before')).not.toContain('-ml-1');
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

    it('draws its chevron in the destructive colour when its line failed', async () => {
      reduceMotion(false);
      await render(<Step status="error" />);

      expect(chevronClasses()).toContain('text-destructive');
    });

    it('draws its chevron muted when its line did not fail', async () => {
      reduceMotion(false);
      await render(<Step />);

      expect(chevronClasses()).toContain('text-muted-foreground');
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

    describe('on the web', () => {
      const os = Platform.OS;
      beforeEach(() => {
        Platform.OS = 'web';
      });
      afterEach(() => {
        Platform.OS = os;
      });

      /** A focus event whose target answers `:focus-visible` with `visible`, as a browser's does. */
      const focusFrom = (visible: boolean): object => ({
        target: { matches: (selector: string) => selector === ':focus-visible' && visible },
      });

      it('rings the trigger while it holds focus from the keyboard, and not after a press', async () => {
        reduceMotion(false);
        await render(<Step />);
        const trigger = screen.getByTestId('trigger');

        await fireEvent(trigger, 'focus', focusFrom(false));
        expect(emittedClasses(screen.getByTestId('trigger').props.className)).not.toContain('border-ring/50');

        await fireEvent(trigger, 'blur');
        await fireEvent(trigger, 'focus', focusFrom(true));
        expect(emittedClasses(screen.getByTestId('trigger').props.className)).toContain('border-ring/50');
      });
    });
  });
});
