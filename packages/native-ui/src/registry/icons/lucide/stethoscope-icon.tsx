// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link StethoscopeIcon} through. */
type StethoscopeIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the chest piece, the tube and the ear piece, in the 24-unit viewBox. */
const CHEST = 12.57;
const TUBE = 21.85;
const EARS = 35.14;

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
 * Lucide's stethoscope icon, which is drawn in again from its chest piece up to its ear tips when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function StethoscopeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  // One part after another, the paths from their far end, as the web twin's run their pathOffset 0.25 s apart.
  const chest = useAnimatedProps(() => drawIn(progress.value, CHEST, 0, 1 / 3));
  const tube = useAnimatedProps(() => drawIn(progress.value, TUBE, 1 / 3, 2 / 3, true));
  const ears = useAnimatedProps(() => drawIn(progress.value, EARS, 2 / 3, 1, true));
  const rightTip = useAnimatedProps(() => drawIn(progress.value, 2, 2 / 3, 1, true));
  const leftTip = useAnimatedProps(() => drawIn(progress.value, 2, 2 / 3, 1, true));

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
      <AnimatedPath d="M11 2v2" animatedProps={rightTip} />
      <AnimatedPath d="M5 2v2" animatedProps={leftTip} />
      <AnimatedPath d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" animatedProps={ears} />
      <AnimatedPath d="M8 15a6 6 0 0 0 12 0v-3" animatedProps={tube} />
      <AnimatedCircle cx="20" cy="10" r="2" animatedProps={chest} />
    </Svg>
  );
}

export { StethoscopeIcon };
export type { StethoscopeIconHandle };
