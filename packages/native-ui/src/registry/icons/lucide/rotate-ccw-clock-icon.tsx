// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RotateCcwClockIcon} through. */
type RotateCcwClockIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the arrow turns backwards, in degrees about the middle, and how small it gets as it does: the web twin's
 * 50, which would sweep the arrowhead past the canvas, which react-native-svg clips, so it shrinks a little as it
 * turns.
 */
const TURN = -50;
const SIZE = 0.86;

/** How far each hand turns backwards about the middle, in degrees: the web twin's. */
const HOUR = -360;
const MINUTE = -45;

/**
 * Lucide's rotate-ccw-clock icon, whose arrow turns back part of the way round as its hands turn back, and returns when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function RotateCcwClockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({ rotate: TURN * progress.value, scaleX: size, scaleY: size });
  });
  // Lucide draws both hands as one path; the web twin splits it at the middle to turn each on its own.
  const hour = useAnimatedProps(() => transformProps({ rotate: HOUR * progress.value }));
  const minute = useAnimatedProps(() => transformProps({ rotate: MINUTE * progress.value }));

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
      <AnimatedG animatedProps={arrow}>
        <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <Path d="M3 3v5h5" />
      </AnimatedG>
      <AnimatedPath d="M12 7v5" animatedProps={hour} />
      <AnimatedPath d="m12 12 4 2" animatedProps={minute} />
    </Svg>
  );
}

export { RotateCcwClockIcon };
export type { RotateCcwClockIconHandle };
