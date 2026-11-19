// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RefreshCwOffIcon} through. */
type RefreshCwOffIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Where the icon is at each half of the way out, and its size: the web twin shakes by 3 either way, which would take
 * its slash past the canvas, which react-native-svg clips, so it shakes by 2, shrinking a little.
 */
const SHAKE = [0, -2, 2];
const SIZE = [1, 0.9, 0.9];

/**
 * Lucide's refresh-cw-off icon, which shakes from side to side when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function RefreshCwOffIcon({
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
      x: interpolate(progress.value, [0, 0.5, 1], SHAKE),
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
        <Path d="M21 8L18.74 5.74A9.75 9.75 0 0 0 12 3C11 3 10.03 3.16 9.13 3.47" />
        <Path d="M8 16H3v5" />
        <Path d="M3 12C3 9.51 4 7.26 5.64 5.64" />
        <Path d="m3 16 2.26 2.26A9.75 9.75 0 0 0 12 21c2.49 0 4.74-1 6.36-2.64" />
        <Path d="M21 12c0 1-.16 1.97-.47 2.87" />
        <Path d="M21 3v5h-5" />
        <Path d="M22 22 2 2" />
      </AnimatedG>
    </Svg>
  );
}

export { RefreshCwOffIcon };
export type { RefreshCwOffIconHandle };
