import { act, render } from '@testing-library/react-native';
import { createRef, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useIconMotion, type IconHandle, type IconTiming } from './icon-motion';

const TIMING: IconTiming = { duration: 200 };

let progress: SharedValue<number> | undefined;

/** Hands the progress `useIconMotion` returns to the spec. */
function Probe({ handle, timing = TIMING }: { handle: Ref<IconHandle>; timing?: IconTiming }): ReactNode {
  progress = useIconMotion(handle, timing);
  return null;
}

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

/** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

const progressNow = (): number => progress?.value ?? Number.NaN;

beforeEach(() => {
  jest.useFakeTimers();
  progress = undefined;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useIconMotion', () => {
  it('runs progress out and back on start', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(200);
    expect(progressNow()).toBeGreaterThan(0);

    await elapse(400);
    expect(progressNow()).toBe(0);
  });

  it('runs a spring out and back on start', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} timing={{ spring: { stiffness: 160, damping: 17, mass: 1 } }} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(150);
    expect(progressNow()).toBeGreaterThan(0);

    await elapse(3000);
    expect(progressNow()).toBe(0);
  });

  it('leaves progress at 0 under reduced motion', async () => {
    reduceMotion(true);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    for (const ms of [50, 100, 200, 400]) {
      await elapse(ms);
      expect(progressNow()).toBe(0);
    }
  });

  it('returns progress to 0 on stop', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(150);
    expect(progressNow()).toBeGreaterThan(0);

    await act(() => handle.current?.stopAnimation());
    expect(progressNow()).toBe(0);
    await elapse(400);
    expect(progressNow()).toBe(0);
  });
});
