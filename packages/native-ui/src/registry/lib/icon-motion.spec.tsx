import { act, render } from '@testing-library/react-native';
import { createRef, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { dash, transformProps, useIconMotion, type IconHandle, type IconTiming } from './icon-motion';

let progress: SharedValue<number> | undefined;

/** Hands the progress `useIconMotion` returns to the spec. */
function Probe({ handle, timing }: { handle: Ref<IconHandle>; timing?: IconTiming }): ReactNode {
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
  it('runs progress out and back on start, within 500 ms by default', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(250);
    expect(progressNow()).toBeGreaterThan(0.9);

    await elapse(250);
    expect(progressNow()).toBe(0);
  });

  it('runs each leg over the duration it is given', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} timing={{ duration: 50 }} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(50);
    expect(progressNow()).toBeGreaterThan(0.9);

    await elapse(50);
    expect(progressNow()).toBe(0);
  });

  it('caps each leg at 250 ms', async () => {
    reduceMotion(false);
    const handle = createRef<IconHandle>();
    await render(<Probe handle={handle} timing={{ duration: 2000 }} />);
    await elapse(0);

    await act(() => handle.current?.startAnimation());
    await elapse(500);
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

describe('transformProps', () => {
  it('leaves a shape where it is when nothing moves', () => {
    expect(transformProps({})).toEqual({
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      originX: 12,
      originY: 12,
    });
  });

  it('names its parts the way react-native-svg reads them, about the origin it is given', () => {
    expect(transformProps({ x: 2, y: -3, scaleX: 2, scaleY: 0.5, rotate: 45, originX: 4, originY: 6 })).toEqual({
      translateX: 2,
      translateY: -3,
      scaleX: 2,
      scaleY: 0.5,
      rotation: 45,
      originX: 4,
      originY: 6,
    });
  });

  it('keeps a scale above zero, which react-native-svg reads as none', () => {
    const { scaleX, scaleY } = transformProps({ scaleX: 0, scaleY: 0 });
    expect(scaleX).toBeGreaterThan(0);
    expect(scaleY).toBeGreaterThan(0);
  });
});

describe('dash', () => {
  it('draws a path in full with a dash longer than it', () => {
    expect(dash(10, 1)).toEqual({ strokeDasharray: [20, 20], strokeDashoffset: 0, opacity: 1 });
  });

  it('draws the part of a path from start for fraction of it', () => {
    expect(dash(10, 0.5, 0.25)).toEqual({ strokeDasharray: [5, 20], strokeDashoffset: -2.5, opacity: 1 });
  });

  it('hides a path drawn not at all', () => {
    expect(dash(10, 0).opacity).toBe(0);
  });
});
