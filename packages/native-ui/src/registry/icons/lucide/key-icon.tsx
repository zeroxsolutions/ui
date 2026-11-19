// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link KeyIcon} through. */
type KeyIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The turn, in degrees about the bow, past its stop and back to it, and the key's size as it turns: the web twin's 33
 * and 25 would swing the shaft past the left of the canvas, which react-native-svg clips, so it turns less and
 * shrinks towards the bow as it turns.
 */
const TURN = [0, 15, 12];
const SIZE = [1, 0.85, 0.85];

/**
 * Lucide's key icon, which turns in its lock, and back when started. Hidden from a screen reader: the control around it
 * says what it does.
 */
function KeyIcon({
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
      rotate: interpolate(progress.value, [0, 0.75, 1], TURN),
      scaleX: interpolate(progress.value, [0, 0.75, 1], SIZE),
      scaleY: interpolate(progress.value, [0, 0.75, 1], SIZE),
      originX: 16.8,
      originY: 7.2,
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
        <Path d="m2 21 9.6-9.6" />
        <Path d="m7.5 15.5 2.3 2.3a1 1 0 0 1 0 1.4l-2.1 2.1a1 1 0 0 1-1.4 0L4 19" />
        <Circle cx="15.5" cy="7.5" r="5.5" />
      </AnimatedG>
    </Svg>
  );
}

export { KeyIcon };
export type { KeyIconHandle };
