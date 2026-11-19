// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RockingChairIcon} through. */
type RockingChairIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The rock, in degrees about the foot of the back (2.4, 21.6) at each half of the way out: the web twin's. */
const ROCK = [0, -5, 5];

/**
 * Lucide's rocking-chair icon, which rocks back, then forward, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function RockingChairIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.5, 1], ROCK),
      originX: 2.4,
      originY: 21.6,
    }),
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
      <AnimatedG animatedProps={whole}>
        <Path d="m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" />
        <Path d="m9 13-3.708 7.416" />
        <Path d="m15 13 3.708 7.416" />
        <Path d="M3 19a15 15 0 0 0 18 0" />
      </AnimatedG>
    </Svg>
  );
}

export { RockingChairIcon };
export type { RockingChairIconHandle };
