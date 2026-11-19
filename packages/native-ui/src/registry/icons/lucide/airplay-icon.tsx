// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AirplayIcon} through. */
type AirplayIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the screen, in the 24-unit viewBox. */
const SCREEN = 50.57;

/** The way out is quick, so the way back is what draws the screen and pops the triangle in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's airplay icon, whose screen is drawn in again from nothing while its triangle fades in, overshooting its
 * size, when started. Hidden from a screen reader: the control around it says what it does.
 */
function AirplayIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const screen = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(SCREEN, drawn, 1 - drawn), opacity: drawn };
  });
  const triangle = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    const scale = interpolate(drawn, [0, 0.5, 1], [0.6, 1.1, 1]);
    return { opacity: drawn, ...transformProps({ scaleX: scale, scaleY: scale, originX: 12, originY: 18 }) };
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
      <AnimatedPath
        d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"
        animatedProps={screen}
      />
      <AnimatedPath d="m12 15 5 6H7Z" animatedProps={triangle} />
    </Svg>
  );
}

export { AirplayIcon };
export type { AirplayIconHandle };
