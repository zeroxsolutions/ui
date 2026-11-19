// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SwitchCameraIcon} through. */
type SwitchCameraIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in; half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/** The length of each side of the body, in the 24-unit viewBox. */
const SIDE = 28.28;

/** The length of each arrow, in the 24-unit viewBox. */
const ARROW = 8.49;

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
 * Lucide's switch-camera icon, whose body and arrows are drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function SwitchCameraIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const left = useAnimatedProps(() => drawIn(progress.value, SIDE, 0, 1));
  const right = useAnimatedProps(() => drawIn(progress.value, SIDE, 0, 1));
  const lower = useAnimatedProps(() => drawIn(progress.value, ARROW, 0, 1));
  const upper = useAnimatedProps(() => drawIn(progress.value, ARROW, 0, 1));

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
      <AnimatedPath d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" animatedProps={left} />
      <AnimatedPath d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" animatedProps={right} />
      <AnimatedPath d="m18 22-3-3 3-3" animatedProps={lower} />
      <AnimatedPath d="m6 2 3 3-3 3" animatedProps={upper} />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export { SwitchCameraIcon };
export type { SwitchCameraIconHandle };
