// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SaudiRiyalIcon} through. */
type SaudiRiyalIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of each stroke, in the 24-unit viewBox. */
const FOOT = 5.39;
const RIGHT = 15.38;
const LEFT = 20.71;
const BAR = 16.16;

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
 * Lucide's saudi-riyal icon, whose sign is drawn in again when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function SaudiRiyalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const foot = useAnimatedProps(() => drawIn(progress.value, FOOT, 0, 1));
  const right = useAnimatedProps(() => drawIn(progress.value, RIGHT, 0, 1));
  const left = useAnimatedProps(() => drawIn(progress.value, LEFT, 0, 1));
  const bar = useAnimatedProps(() => drawIn(progress.value, BAR, 0, 1));

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
      <AnimatedPath d="m19 18-5 2" animatedProps={foot} />
      <AnimatedPath d="M14 4v9.523a1 1 0 001.371.928L19 13" animatedProps={right} />
      <AnimatedPath d="M10 2.977v13.19a2 2 0 01-1.23 1.846L4 19.999" animatedProps={left} />
      <AnimatedPath d="M19 8 4 14" animatedProps={bar} />
    </Svg>
  );
}

export { SaudiRiyalIcon };
export type { SaudiRiyalIconHandle };
