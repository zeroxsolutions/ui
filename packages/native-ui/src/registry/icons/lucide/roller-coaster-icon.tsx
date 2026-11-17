// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RollerCoasterIcon} through. */
type RollerCoasterIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the track, in the 24-unit viewBox. */
const TRACK = 47.18;

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
 * Lucide's roller-coaster icon, whose posts and track are drawn in again, the track last when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function RollerCoasterIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  // The track waits for the posts, as the web twin's waits 0.2 s.
  const first = useAnimatedProps(() => drawIn(progress.value, 14, 0, 0.6));
  const second = useAnimatedProps(() => drawIn(progress.value, 12.2, 0, 0.6));
  const third = useAnimatedProps(() => drawIn(progress.value, 7.8, 0, 0.6));
  const fourthTop = useAnimatedProps(() => drawIn(progress.value, 4, 0, 0.6));
  const fourth = useAnimatedProps(() => drawIn(progress.value, 6, 0, 0.6));
  const fifth = useAnimatedProps(() => drawIn(progress.value, 10, 0, 0.6));
  const track = useAnimatedProps(() => drawIn(progress.value, TRACK, 0.4, 1));

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
      <AnimatedPath d="M6 19V5" animatedProps={first} />
      <AnimatedPath d="M10 19V6.8" animatedProps={second} />
      <AnimatedPath d="M14 19v-7.8" animatedProps={third} />
      <AnimatedPath d="M18 5v4" animatedProps={fourthTop} />
      <AnimatedPath d="M18 19v-6" animatedProps={fourth} />
      <AnimatedPath d="M22 19V9" animatedProps={fifth} />
      <AnimatedPath d="M2 19V9a4 4 0 0 1 4-4c2 0 4 1.33 6 4s4 4 6 4a4 4 0 1 0-3-6.65" animatedProps={track} />
    </Svg>
  );
}

export { RollerCoasterIcon };
export type { RollerCoasterIconHandle };
