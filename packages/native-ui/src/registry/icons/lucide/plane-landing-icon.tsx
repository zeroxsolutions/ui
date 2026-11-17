// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PlaneLandingIcon} through. */
type PlaneLandingIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what flies the plane in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Where the plane comes from, in the 24-unit viewBox, where it overshoots, and its tilt in degrees at each: far
 * less than the web twin's 38 and 20, which come from past the canvas, which react-native-svg clips.
 */
const FROM_X = [-6, 1, 0];
const FROM_Y = [-3.2, 1, 0];
const TILT = [16, -5, 0];

/** Where on the way back the plane has come in and overshoots: the web twin's. */
const STEPS = [0, 0.65, 1];

/**
 * Lucide's plane-landing icon, which flies in from the upper left and lands when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function PlaneLandingIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const plane = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    const size = interpolate(shown, [0, 1], [0.5, 1]);
    return {
      ...transformProps({
        x: interpolate(shown, STEPS, FROM_X),
        y: interpolate(shown, STEPS, FROM_Y),
        rotate: interpolate(shown, STEPS, TILT),
        scaleX: size,
        scaleY: size,
        originX: 11.57,
        originY: 10.21,
      }),
      opacity: interpolate(shown, [0, 0.65], [0, 1], Extrapolation.CLAMP),
    };
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
      <Path d="M2 22h20" />
      <AnimatedPath
        d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z"
        animatedProps={plane}
      />
    </Svg>
  );
}

export { PlaneLandingIcon };
export type { PlaneLandingIconHandle };
