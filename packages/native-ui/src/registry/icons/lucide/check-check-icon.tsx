// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CheckCheckIcon} through. */
type CheckCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each tick: its length, and the middle it grows about, in the 24-unit viewBox. */
const TICKS = [
  { length: 22.63, originX: 10, originY: 11.5 },
  { length: 12.73, originX: 17.5, originY: 13.75 },
];

/** The tick `index` at `progress`, the second drawn a fifth of the way back after the first. */
function tick(progress: number, index: number): ReturnType<typeof dash> & IconTransformProps {
  'worklet';
  const { length, originX, originY } = TICKS[index];
  const drawn = interpolate(1 - progress, [0.2 * index, 0.2 * index + 0.8], [0, 1], Extrapolation.CLAMP);
  const scale = 0.5 + 0.5 * drawn;
  return {
    ...dash(length, drawn),
    opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP),
    ...transformProps({ scaleX: scale, scaleY: scale, originX, originY }),
  };
}

/** The way out is quick, so the way back is what draws the ticks in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's check-check icon, whose two ticks are drawn in again from nothing, growing from half size, one after the
 * other, when started. Hidden from a screen reader: the control around it says what it does.
 */
function CheckCheckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const first = useAnimatedProps(() => tick(progress.value, 0));
  const second = useAnimatedProps(() => tick(progress.value, 1));

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
      <AnimatedPath d="M2 12 7 17L18 6" animatedProps={first} />
      <AnimatedPath d="M13 16L14.5 17.5L22 10" animatedProps={second} />
    </Svg>
  );
}

export { CheckCheckIcon };
export type { CheckCheckIconHandle };
