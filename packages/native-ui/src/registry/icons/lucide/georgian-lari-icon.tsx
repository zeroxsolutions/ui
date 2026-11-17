// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GeorgianLariIcon} through. */
type GeorgianLariIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the curve, in the 24-unit viewBox. */
const CURVE = 32.99;

/** The length of the base, in the 24-unit viewBox. */
const BASE = 14;

/** The length of each stem, in the 24-unit viewBox. */
const STEM = 7;

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
 * Lucide's georgian-lari icon, whose curve and base are drawn in again, then its two stems when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function GeorgianLariIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const curve = useAnimatedProps(() => drawIn(progress.value, CURVE, 0, 0.6, true));
  const base = useAnimatedProps(() => drawIn(progress.value, BASE, 0, 0.6));
  const stem0 = useAnimatedProps(() => drawIn(progress.value, STEM, 0.5, 1, true));
  const stem1 = useAnimatedProps(() => drawIn(progress.value, STEM, 0.5, 1, true));

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
      <AnimatedPath d="M10 10V3" animatedProps={stem0} />
      <AnimatedPath d="M14 10V3" animatedProps={stem1} />
      <AnimatedPath d="M19 13a7 7 0 10-7 7" animatedProps={curve} />
      <AnimatedPath d="M5 20h14" animatedProps={base} />
    </Svg>
  );
}

export { GeorgianLariIcon };
export type { GeorgianLariIconHandle };
