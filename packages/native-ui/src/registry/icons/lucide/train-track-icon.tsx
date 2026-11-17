// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TrainTrackIcon} through. */
type TrainTrackIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each sleeper, in the 24-unit viewBox. */
const SLEEPER = 11.31;

/**
 * How far into the way back each sleeper starts after the one before it, and how long it takes: the web twin's 0.1 and
 * 0.3 s, in proportion.
 */
const STAGGER = 1 / 7;
const LAY = 3 / 7;

/**
 * The stroke of a part `length` units long, drawn in over its own stretch of the way back, from `start` to `end`
 * of it, beginning at its far end when `fromEnd`.
 */
function drawIn(
  progress: number,
  length: number,
  start: number,
  end: number,
  fromEnd = false,
): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return dash(length, drawn, fromEnd ? 1 - drawn : 0);
}

/**
 * Lucide's train-track icon, whose sleepers are laid again one after another, from the top right when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function TrainTrackIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const sleeper0 = useAnimatedProps(() => drawIn(progress.value, SLEEPER, 0 * STAGGER, 0 * STAGGER + LAY));
  const sleeper1 = useAnimatedProps(() => drawIn(progress.value, SLEEPER, 1 * STAGGER, 1 * STAGGER + LAY));
  const sleeper2 = useAnimatedProps(() => drawIn(progress.value, SLEEPER, 2 * STAGGER, 2 * STAGGER + LAY));
  const sleeper3 = useAnimatedProps(() => drawIn(progress.value, SLEEPER, 3 * STAGGER, 3 * STAGGER + LAY));
  const sleeper4 = useAnimatedProps(() => drawIn(progress.value, SLEEPER, 4 * STAGGER, 4 * STAGGER + LAY));

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M2 17 17 2" />
      <AnimatedPath d="m2 14 8 8" animatedProps={sleeper4} />
      <AnimatedPath d="m5 11 8 8" animatedProps={sleeper3} />
      <AnimatedPath d="m8 8 8 8" animatedProps={sleeper2} />
      <AnimatedPath d="m11 5 8 8" animatedProps={sleeper1} />
      <AnimatedPath d="m14 2 8 8" animatedProps={sleeper0} />
      <Path d="M7 22 22 7" />
    </Svg>
  );
}

export { TrainTrackIcon };
export type { TrainTrackIconHandle };
