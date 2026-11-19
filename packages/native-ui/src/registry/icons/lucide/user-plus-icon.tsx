// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link UserPlusIcon} through. */
type UserPlusIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The way out is quick, so the way back is what spins the plus in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * The plus at each point of the way back, about its middle (19, 11): its size, its turn in degrees and its opacity,
 * the web twin's keyframes.
 */
const AT = [0, 0.7, 1];
const SIZE = [0, 1.15, 1];
const TURN = [-90, 0, 0];
const SHOWN = [0, 1, 1];

/**
 * Lucide's user-plus icon, whose plus spins in from nothing, a little too large, and settles when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function UserPlusIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const plus = useAnimatedProps(() => {
    const shown = 1 - progress.value;
    const size = interpolate(shown, AT, SIZE);
    return {
      opacity: interpolate(shown, AT, SHOWN),
      ...transformProps({ rotate: interpolate(shown, AT, TURN), scaleX: size, scaleY: size, originX: 19, originY: 11 }),
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
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <AnimatedG animatedProps={plus}>
        <Line x1="19" x2="19" y1="8" y2="14" />
        <Line x1="22" x2="16" y1="11" y2="11" />
      </AnimatedG>
    </Svg>
  );
}

export { UserPlusIcon };
export type { UserPlusIconHandle };
