// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WavesHorizontalIcon} through. */
type WavesHorizontalIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the waves in; half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** The length of each wave, in the 24-unit viewBox. */
const WAVE = 21.97;

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
 * Lucide's waves-horizontal icon, whose waves are drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function WavesHorizontalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const top = useAnimatedProps(() => drawIn(progress.value, WAVE, 0, 1));
  const middle = useAnimatedProps(() => drawIn(progress.value, WAVE, 0, 1));
  const bottom = useAnimatedProps(() => drawIn(progress.value, WAVE, 0, 1));

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
      <AnimatedPath d="M2 5q2.5 2 5 0t5 0 5 0 5 0" animatedProps={top} />
      <AnimatedPath d="M2 12q2.5 2 5 0t5 0 5 0 5 0" animatedProps={middle} />
      <AnimatedPath d="M2 19q2.5 2 5 0t5 0 5 0 5 0" animatedProps={bottom} />
    </Svg>
  );
}

export { WavesHorizontalIcon };
export type { WavesHorizontalIconHandle };
