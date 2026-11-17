// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CircleCheckIcon} through. */
type CircleCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the tick, in the 24-unit viewBox. */
const TICK = 11.31;

/** The way out is quick, so the way back is what draws the tick in. */
const TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's circle-check icon, whose tick is drawn in again from nothing when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function CircleCheckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const tick = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(TICK, drawn, 1 - drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
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
      <Circle cx="12" cy="12" r="10" />
      <AnimatedPath d="m16 9-5.5 5.5L8 12" animatedProps={tick} />
    </Svg>
  );
}

export { CircleCheckIcon };
export type { CircleCheckIconHandle };
