// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HourglassIcon} through. */
type HourglassIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How much the hourglass shrinks through the turn, as a fraction of its size: the web twin keeps it whole, and turned
 * whole its corners would sweep past the canvas, which react-native-svg clips.
 */
const SHRINK = 0.1;

/**
 * Lucide's hourglass icon, which turns over and back when started. Hidden from a screen reader: the control around it
 * says what it does.
 */
function HourglassIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const glass = useAnimatedProps(() => {
    const scale = 1 - SHRINK * interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    return transformProps({ rotate: 180 * progress.value, scaleX: scale, scaleY: scale });
  });

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
      <AnimatedG animatedProps={glass}>
        <Path d="M5 22h14" />
        <Path d="M5 2h14" />
        <Path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <Path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </AnimatedG>
    </Svg>
  );
}

export { HourglassIcon };
export type { HourglassIconHandle };
