import { act, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion as useSettingAtStart } from 'react-native-reanimated';
import { usePopupMotion, usePresence, usePulse } from './motion';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated');
  return { ...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => false) };
});

const MOTION = { duration: 100 };

/** Draws a part while `usePresence` keeps it, at the opacity its progress has reached. */
function Part({ open }: { open: boolean }): ReactNode {
  const { present, progress } = usePresence(open, MOTION, { duration: 200 });
  const style = useAnimatedStyle(() => ({ opacity: progress.value }));
  return present ? <Animated.View testID="part" style={style} /> : null;
}

describe('usePresence', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

  describe('with motion', () => {
    beforeEach(() => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    });

    it('draws nothing while closed', async () => {
      await render(<Part open={false} />);
      await elapse(300);

      expect(screen.queryByTestId('part')).toBeNull();
    });

    it('draws the part as it opens and brings it in over the enter duration', async () => {
      await render(<Part open={false} />);

      await screen.rerender(<Part open />);
      await elapse(50);
      const midway = screen.getByTestId('part');
      expect(midway).not.toHaveAnimatedStyle({ opacity: 0 });
      expect(midway).not.toHaveAnimatedStyle({ opacity: 1 });

      await elapse(100);
      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('brings in a part that is open from the start', async () => {
      await render(<Part open />);

      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 0 });
      await elapse(150);
      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 1 });
    });

    it('keeps the part drawn while it goes out over the exit duration, then removes it', async () => {
      await render(<Part open />);
      await elapse(150);

      await screen.rerender(<Part open={false} />);
      await elapse(100);
      const midway = screen.getByTestId('part');
      expect(midway).not.toHaveAnimatedStyle({ opacity: 0 });
      expect(midway).not.toHaveAnimatedStyle({ opacity: 1 });

      await elapse(150);
      expect(screen.queryByTestId('part')).toBeNull();
    });

    it('keeps a part reopened while it goes out', async () => {
      await render(<Part open />);
      await elapse(150);

      await screen.rerender(<Part open={false} />);
      await elapse(100);
      await screen.rerender(<Part open />);
      await elapse(300);

      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 1 });
    });
  });

  describe('when the system asks for reduced motion', () => {
    beforeEach(() => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    });

    it('shows the part in full at once and removes it at once', async () => {
      await render(<Part open={false} />);
      await elapse(0);

      await screen.rerender(<Part open />);
      await elapse(16);
      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 1 });

      await screen.rerender(<Part open={false} />);
      expect(screen.queryByTestId('part')).toBeNull();
    });
  });

  describe('when the setting is already known on the first render', () => {
    it('draws a part open from the start in full, before the async read lands', async () => {
      jest.mocked(useSettingAtStart).mockReturnValue(true);
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(() => undefined));

      await render(<Part open />);
      await elapse(16);

      expect(screen.getByTestId('part')).toHaveAnimatedStyle({ opacity: 1 });
    });
  });
});

/** Draws a popup's layer while `usePopupMotion` keeps it. */
function Popup({ open }: { open: boolean }): ReactNode {
  const { present, style } = usePopupMotion(open, 'right');
  return present ? <Animated.View testID="popup" style={style} /> : null;
}

describe('usePopupMotion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

  it('on the web, takes no pointer while the popup comes in, and takes it once the popup is in', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Popup open={false} />);

    await screen.rerender(<Popup open />);
    await elapse(50);
    expect(screen.getByTestId('popup')).toHaveStyle({ pointerEvents: 'none' });

    await elapse(100);
    expect(screen.getByTestId('popup')).not.toHaveStyle({ pointerEvents: 'none' });
  });
});

/** Draws a part that pulses while `pulsing`. */
function Pulsing({ pulsing }: { pulsing: boolean }): ReactNode {
  const style = usePulse(pulsing);
  return <Animated.View testID="pulsing" style={style} />;
}

/** The opacity a view is drawn at, or none when nothing sets one. */
const opacityOf = (testID: string): unknown => StyleSheet.flatten(screen.getByTestId(testID).props.style)?.opacity;

describe('usePulse', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

  it('fades the part to half opacity and back each second while pulsing', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await render(<Pulsing pulsing />);

    await elapse(1000);
    expect(screen.getByTestId('pulsing')).toHaveAnimatedStyle({ opacity: 0.5 });
    await elapse(1000);
    expect(screen.getByTestId('pulsing')).toHaveAnimatedStyle({ opacity: 1 });
  });

  it('sets no opacity while not pulsing, and none once it stops', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await render(<Pulsing pulsing={false} />);
    expect(opacityOf('pulsing')).toBeUndefined();

    await screen.rerender(<Pulsing pulsing />);
    await elapse(500);
    await screen.rerender(<Pulsing pulsing={false} />);
    expect(opacityOf('pulsing')).toBeUndefined();
  });

  it('sets no opacity when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<Pulsing pulsing />);
    await elapse(1000);

    expect(opacityOf('pulsing')).toBeUndefined();
  });
});
