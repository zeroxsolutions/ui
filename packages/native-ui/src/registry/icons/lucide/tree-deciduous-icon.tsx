// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TreeDeciduousIcon} through. */
type TreeDeciduousIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The sway, in degrees about the foot of the trunk (12, 21) at each half of the way out: the web twin's first
 * keyframes.
 */
const ROCK = [0, -10, 10];

/**
 * Lucide's tree-deciduous icon, which sways one way, then the other, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function TreeDeciduousIcon({
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
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], ROCK), originX: 12, originY: 21 }),
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
        <Path d="M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z" />
        <Path d="M12 19v3" />
      </AnimatedG>
    </Svg>
  );
}

export { TreeDeciduousIcon };
export type { TreeDeciduousIconHandle };
