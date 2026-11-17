// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RotateCwIcon} through. */
type RotateCwIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the arrow turns, in degrees about the middle, and how small it gets as it does: the web twin's 50,
 * which would sweep the arrowhead past the canvas, which react-native-svg clips, so it shrinks a little as it turns,
 * as refresh-cw's arrows do.
 */
const TURN = 50;
const SIZE = 0.86;

/**
 * Lucide's rotate-cw icon, which turns part of the way round and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function RotateCwIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({ rotate: TURN * progress.value, scaleX: size, scaleY: size });
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
      <AnimatedG animatedProps={whole}>
        <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <Path d="M21 3v5h-5" />
      </AnimatedG>
    </Svg>
  );
}

export { RotateCwIcon };
export type { RotateCwIconHandle };
