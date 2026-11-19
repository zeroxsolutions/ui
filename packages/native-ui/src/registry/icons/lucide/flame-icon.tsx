// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FlameIcon} through. */
type FlameIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what draws the flame in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the flame, in the 24-unit viewBox. */
const FLAME = 57.47;

/**
 * Lucide's flame icon, which is drawn in again from nothing when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function FlameIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const flame = useAnimatedProps(() =>
    dash(FLAME, interpolate(1 - progress.value, [0.2, 1], [0, 1], Extrapolation.CLAMP)),
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
      <AnimatedPath
        d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
        animatedProps={flame}
      />
    </Svg>
  );
}

export { FlameIcon };
export type { FlameIconHandle };
