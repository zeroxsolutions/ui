// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HeartHandshakeIcon} through. */
type HeartHandshakeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The rock after the squeeze, in degrees about the middle. */
const ROCK = [0, -7, 7];

/**
 * Lucide's heart-handshake icon, which squeezes, then rocks, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function HeartHandshakeIcon({
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
      scaleX: interpolate(progress.value, [0, 0.25, 0.5], [1, 0.9, 1], Extrapolation.CLAMP),
      scaleY: interpolate(progress.value, [0, 0.25, 0.5], [1, 0.9, 1], Extrapolation.CLAMP),
      rotate: interpolate(progress.value, [0.5, 0.75, 1], ROCK, Extrapolation.CLAMP),
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
        <Path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
      </AnimatedG>
    </Svg>
  );
}

export { HeartHandshakeIcon };
export type { HeartHandshakeIconHandle };
