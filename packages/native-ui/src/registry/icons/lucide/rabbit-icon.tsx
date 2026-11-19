// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RabbitIcon} through. */
type RabbitIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The dart at each half of the way out, in the 24-unit viewBox, and the tilt in degrees about the middle: the web
 * twin's first two, but for the dart's 3, which would take the rabbit past the canvas, which react-native-svg clips,
 * so it darts 2 and shrinks a little as it does.
 */
const DART_X = [0, 2, -2];
const DART_Y = [0, 1.5, -1.5];
const TILT = [0, 5, -5];
const SIZE = [1, 0.9, 0.9];

/**
 * Lucide's rabbit icon, which darts one way, then the other, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function RabbitIcon({
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
      x: interpolate(progress.value, [0, 0.5, 1], DART_X),
      y: interpolate(progress.value, [0, 0.5, 1], DART_Y),
      rotate: interpolate(progress.value, [0, 0.5, 1], TILT),
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
        <Path d="M13 16a3 3 0 0 1 2.24 5" />
        <Path d="M18 12h.01" />
        <Path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />
        <Path d="M20 8.54V4a2 2 0 1 0-4 0v3" />
        <Path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" />
      </AnimatedG>
    </Svg>
  );
}

export { RabbitIcon };
export type { RabbitIconHandle };
