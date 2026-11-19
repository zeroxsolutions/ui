// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AtSignIcon} through. */
type AtSignIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the ring and the tail, in the 24-unit viewBox. */
const RING = 25.13;
const TAIL = 68.99;

/** The way out is quick, so the way back is what draws the ring and the tail in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's at-sign icon, whose ring and then whose tail are drawn in again from nothing when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function AtSignIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ring = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 0.5], [0, 1], Extrapolation.CLAMP);
    return { ...dash(RING, drawn, 1 - drawn), opacity: interpolate(drawn, [0, 1 / 3], [0, 1], Extrapolation.CLAMP) };
  });
  const tail = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP);
    return { ...dash(TAIL, drawn), opacity: interpolate(drawn, [0, 1 / 3], [0, 1], Extrapolation.CLAMP) };
  });

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
      <AnimatedCircle cx="12" cy="12" r="4" animatedProps={ring} />
      <AnimatedPath d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" animatedProps={tail} />
    </Svg>
  );
}

export { AtSignIcon };
export type { AtSignIconHandle };
