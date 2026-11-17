// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MessageCircleIcon} through. */
type MessageCircleIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The rock, in degrees about the middle at each half of the way out: the web twin's. */
const ROCK = [0, -7, 7];

/**
 * The bubble's size at each half of the way out: the web twin grows it to 1.05, which would push the bubble past
 * the canvas, which react-native-svg clips, so it shrinks a little as it rocks.
 */
const SIZE = [1, 0.97, 0.97];

/**
 * Lucide's message-circle icon, which rocks one way, then the other, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function MessageCircleIcon({
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
        <Path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      </AnimatedG>
    </Svg>
  );
}

export { MessageCircleIcon };
export type { MessageCircleIconHandle };
