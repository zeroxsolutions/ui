// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CircleIcon} through. */
type CircleIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The length of the ring, in the 24-unit viewBox. */
const RING = 62.84;

/** The way out is quick, so the way back is what draws the ring in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's circle icon, drawn in again from nothing when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function CircleIcon({
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
    const drawn = 1 - progress.value;
    return { ...dash(RING, drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
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
      <AnimatedCircle cx="12" cy="12" r="10" animatedProps={ring} />
    </Svg>
  );
}

export { CircleIcon };
export type { CircleIconHandle };
