// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link KeyRoundIcon} through. */
type KeyRoundIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The hop in the 24-unit viewBox, and the rock in degrees, at each half of the way out: a third of the web twin's
 * 3-unit hop and less than its 3-degree rock, which would take the bow past the top of the canvas, which react-native-svg clips.
 */
const HOP = [0, -1, 0];
const ROCK = [0, 2, -2];

/**
 * Lucide's key-round icon, which hops and rocks, and back when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function KeyRoundIcon({
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
      y: interpolate(progress.value, [0, 0.5, 1], HOP),
      rotate: interpolate(progress.value, [0, 0.5, 1], ROCK),
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
        <Path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
        <Circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
      </AnimatedG>
    </Svg>
  );
}

export { KeyRoundIcon };
export type { KeyRoundIconHandle };
