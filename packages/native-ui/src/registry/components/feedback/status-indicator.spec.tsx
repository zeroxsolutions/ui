import { act, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { StatusIndicator, type StatusTone } from './status-indicator';

const HIDDEN = { includeHiddenElements: true } as const;

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

function dot() {
  return screen.getByTestId('dot', HIDDEN);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('StatusIndicator', () => {
  it.each([
    ['online', 'bg-success'],
    ['idle', 'bg-warning'],
    ['busy', 'bg-destructive'],
  ] as const)('fills a %s dot with %s', async (tone, fill) => {
    reduceMotion(false);
    await render(<StatusIndicator testID="dot" tone={tone} />);

    expect(emittedClasses(dot().props.className)).toEqual(
      expect.arrayContaining(['size-2', 'shrink-0', 'rounded-full', fill]),
    );
  });

  it('draws offline as a hollow ring in the muted foreground, with no fill', async () => {
    reduceMotion(false);
    await render(<StatusIndicator testID="dot" tone="offline" />);

    const classes = emittedClasses(dot().props.className);
    expect(classes).toEqual(expect.arrayContaining(['border', 'border-muted-foreground']));
    expect(classes.filter((name) => name.startsWith('bg-'))).toEqual([]);
  });

  it.each(['online', 'offline', 'busy', 'idle'] satisfies StatusTone[])(
    'hides a %s dot from a screen reader, which reads the text beside it',
    async (tone) => {
      reduceMotion(false);
      await render(<StatusIndicator testID="dot" tone={tone} />);

      expect(isHiddenFromAccessibility(dot())).toBe(true);
    },
  );

  it("takes the caller's classes after its own", async () => {
    reduceMotion(false);
    await render(<StatusIndicator testID="dot" tone="online" className="size-3" />);

    const classes = emittedClasses(dot().props.className);
    expect(classes).toContain('size-3');
    expect(classes).not.toContain('size-2');
  });

  describe('pulse', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    /** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
    const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

    /** The opacity the dot is drawn at, after `ms` pass, or none when it is not animated. */
    const opacityAfter = async (ms: number): Promise<unknown> => {
      await elapse(ms);
      return StyleSheet.flatten(dot().parent?.props.style)?.opacity;
    };

    it('fades the dot to half opacity and back while it pulses', async () => {
      reduceMotion(false);
      await render(<StatusIndicator testID="dot" tone="online" pulse />);

      await elapse(1000);
      expect(dot().parent).toHaveAnimatedStyle({ opacity: 0.5 });
      await elapse(1000);
      expect(dot().parent).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('stands still without pulse', async () => {
      reduceMotion(false);
      await render(<StatusIndicator testID="dot" tone="online" />);

      expect(await opacityAfter(1000)).toBeUndefined();
    });

    it('stands still while pulsing when the person asked to reduce motion', async () => {
      reduceMotion(true);
      await render(<StatusIndicator testID="dot" tone="online" pulse />);

      expect(await opacityAfter(1000)).toBeUndefined();
    });
  });
});
