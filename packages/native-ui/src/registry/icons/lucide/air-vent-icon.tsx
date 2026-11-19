// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AirVentIcon} through. */
type AirVentIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The lengths of the gusts, in the 24-unit viewBox. */
const RIGHT_GUST = 17.67;
const LEFT_GUST = 12.87;

/** The way out is quick, so the way back is what draws the gusts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's air-vent icon, whose two gusts are drawn in again from nothing, the left one after the right, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function AirVentIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const right = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [0, 5 / 7], [0, 1], Extrapolation.CLAMP);
    return { ...dash(RIGHT_GUST, drawn, 1 - drawn), opacity: drawn };
  });
  const left = useAnimatedProps(() => {
    const drawn = interpolate(1 - progress.value, [2 / 7, 1], [0, 1], Extrapolation.CLAMP);
    return { ...dash(LEFT_GUST, drawn, 1 - drawn), opacity: drawn };
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
      <Path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <Path d="M6 8h12" />
      <AnimatedPath d="M18 17.5a2.5 2.5 0 1 1-4 2.03V12" animatedProps={right} />
      <AnimatedPath d="M6.6 15.572A2 2 0 1 0 10 17v-5" animatedProps={left} />
    </Svg>
  );
}

export { AirVentIcon };
export type { AirVentIconHandle };
