// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HandMetalIcon} through. */
type HandMetalIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The rock, in degrees about the wrist at each half of the way out, and the hand's size as it rocks: the web twin's 15
 * would swing the fingers past the canvas, which react-native-svg clips, so it rocks less and shrinks towards the
 * wrist as it rocks.
 */
const ROCK = [0, -10, 10];
const SIZE = [1, 0.88, 0.88];

/**
 * Lucide's hand-metal icon, which rocks from its wrist and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function HandMetalIcon({
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
      scaleX: interpolate(progress.value, [0, 0.5, 1], SIZE),
      scaleY: interpolate(progress.value, [0, 0.5, 1], SIZE),
      originX: 12,
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
        <Path d="M18 12.5V10a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4" />
        <Path d="M14 11V9a2 2 0 1 0-4 0v2" />
        <Path d="M10 10.5V5a2 2 0 1 0-4 0v9" />
        <Path d="m7 15-1.76-1.76a2 2 0 0 0-2.83 2.82l3.6 3.6C7.5 21.14 9.2 22 12 22h2a8 8 0 0 0 8-8V7a2 2 0 1 0-4 0v5" />
      </AnimatedG>
    </Svg>
  );
}

export { HandMetalIcon };
export type { HandMetalIconHandle };
