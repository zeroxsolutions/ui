// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ThermometerIcon} through. */
type ThermometerIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each way takes half of the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200 };

/** The wobble, in degrees about the middle (12, 12) at each half of the way out: the web twin's first keyframes. */
const ROCK = [0, -5, 5];

/**
 * Lucide's thermometer icon, which wobbles one way, then the other, and back when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function ThermometerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const rock = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], ROCK), originX: 12, originY: 12 }),
  );

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
      <AnimatedPath d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" animatedProps={rock} />
    </Svg>
  );
}

export { ThermometerIcon };
export type { ThermometerIconHandle };
