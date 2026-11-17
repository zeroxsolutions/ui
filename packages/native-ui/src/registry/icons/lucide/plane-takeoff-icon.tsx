// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PlaneTakeoffIcon} through. */
type PlaneTakeoffIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what flies the plane in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Where the plane comes from, in the 24-unit viewBox, its size there, and its tilt in degrees: far less than the
 * web twin's 25 and 10, which come from past the canvas, which react-native-svg clips, so it starts smaller.
 */
const FROM_X = 5;
const FROM_Y = 2;
const FROM_SIZE = 0.6;
const TILT = -15;

/**
 * Lucide's plane-takeoff icon, which flies in from the lower left and climbs when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function PlaneTakeoffIcon({
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
    const size = FROM_SIZE + (1 - FROM_SIZE) * shown;
    return {
      ...transformProps({
        x: -FROM_X * progress.value,
        y: FROM_Y * progress.value,
        rotate: TILT * progress.value,
        scaleX: size,
        scaleY: size,
        originX: 12.01,
        originY: 11.38,
      }),
      opacity: shown,
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
        d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z"
        animatedProps={plane}
      />
    </Svg>
  );
}

export { PlaneTakeoffIcon };
export type { PlaneTakeoffIconHandle };
