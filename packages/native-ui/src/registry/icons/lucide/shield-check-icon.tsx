// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShieldCheckIcon} through. */
type ShieldCheckIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the tick in, growing it from the web twin's half size. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the tick, in the 24-unit viewBox, and its size about its middle as it starts: the web twin's. */
const TICK = 8.49;
const FROM = 0.5;

/**
 * Lucide's shield-check icon, whose tick grows and is drawn in again when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ShieldCheckIcon({
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
    const size = 1 - (1 - FROM) * progress.value;
    return { ...transformProps({ scaleX: size, scaleY: size }), ...dash(TICK, 1 - progress.value) };
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
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <AnimatedPath d="m9 12 2 2 4-4" animatedProps={tick} />
    </Svg>
  );
}

export { ShieldCheckIcon };
export type { ShieldCheckIconHandle };
