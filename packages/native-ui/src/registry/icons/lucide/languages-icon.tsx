// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LanguagesIcon} through. */
type LanguagesIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each stroke, in the 24-unit viewBox. */
const DOWN = 8.49;
const SWEEP = 12.09;
const TOP = 12;
const TICK = 1;
const A = 22.36;
const A_BAR = 6;

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
 * Lucide's languages icon, whose characters are written in again stroke by stroke when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LanguagesIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const down = useAnimatedProps(() => drawIn(progress.value, DOWN, 3 / 8, 1, true));
  const sweep = useAnimatedProps(() => drawIn(progress.value, SWEEP, 2 / 8, 7 / 8, true));
  const top = useAnimatedProps(() => drawIn(progress.value, TOP, 1 / 8, 6 / 8, true));
  const tick = useAnimatedProps(() => drawIn(progress.value, TICK, 0, 5 / 8, true));
  const a = useAnimatedProps(() => drawIn(progress.value, A, 3 / 8, 1, true));
  const aBar = useAnimatedProps(() => drawIn(progress.value, A_BAR, 3 / 8, 1, true));

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
      <AnimatedPath d="m5 8 6 6" animatedProps={down} />
      <AnimatedPath d="m4 14 6-6 2-3" animatedProps={sweep} />
      <AnimatedPath d="M2 5h12" animatedProps={top} />
      <AnimatedPath d="M7 2h1" animatedProps={tick} />
      <AnimatedPath d="m22 22-5-10-5 10" animatedProps={a} />
      <AnimatedPath d="M14 18h6" animatedProps={aBar} />
    </Svg>
  );
}

export { LanguagesIcon };
export type { LanguagesIconHandle };
