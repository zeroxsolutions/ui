// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link UsersIcon} through. */
type UsersIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The way out is quick, as the web twin jumps to where it starts, so the way back is what slides it in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** How far the second traveller starts to the left of where it rests: the web twin's. */
const SLIDE = 6;

/**
 * Lucide's users icon, whose second traveller slides out from behind the first and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function UsersIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const second = useAnimatedProps(() => transformProps({ x: -SLIDE * progress.value }));

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
      <AnimatedG animatedProps={second}>
        <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <Path d="M16 3.128a4 4 0 0 1 0 7.744" />
      </AnimatedG>
    </Svg>
  );
}

export { UsersIcon };
export type { UsersIconHandle };
