// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SnowflakeIcon} through. */
type SnowflakeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The shiver, in degrees about the middle at each half of the way out: the web twin's first two keyframes. */
const SHIVER = [0, -5, 5];

/**
 * Lucide's snowflake icon, which shivers one way, then the other, and back when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function SnowflakeIcon({
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
      rotate: interpolate(progress.value, [0, 0.5, 1], SHIVER),
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
        <Path d="m10 20-1.25-2.5L6 18" />
        <Path d="M10 4 8.75 6.5 6 6" />
        <Path d="m14 20 1.25-2.5L18 18" />
        <Path d="m14 4 1.25 2.5L18 6" />
        <Path d="m17 21-3-6h-4" />
        <Path d="m17 3-3 6 1.5 3" />
        <Path d="M2 12h6.5L10 9" />
        <Path d="m20 10-1.5 2 1.5 2" />
        <Path d="M22 12h-6.5L14 15" />
        <Path d="m4 10 1.5 2L4 14" />
        <Path d="m7 21 3-6-1.5-3" />
        <Path d="m7 3 3 6h4" />
      </AnimatedG>
    </Svg>
  );
}

export { SnowflakeIcon };
export type { SnowflakeIconHandle };
