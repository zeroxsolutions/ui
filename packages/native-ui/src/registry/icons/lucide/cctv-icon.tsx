// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CctvIcon} through. */
type CctvIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's cctv icon, whose camera pans up one way, holds, pans down the other way, holds and returns, its light
 * blinking, when started. Hidden from a screen reader: the control around it says what it does.
 */
function CctvIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const camera = useAnimatedProps(() =>
    transformProps({
      x: interpolate(progress.value, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0, 0, 0.5, 0.5, 0]),
      y: interpolate(progress.value, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -0.5, -0.5, 0, 0, 0]),
      rotate: interpolate(progress.value, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -20, -20, 15, 15, 0]),
      originX: 11.69,
      originY: 11.03,
    }),
  );
  const light = useAnimatedProps(() => ({ opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0, 1]) }));

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
      <AnimatedG animatedProps={camera}>
        <Path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" />
        <Path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z" />
        <AnimatedPath d="M7 9h.01" animatedProps={light} />
      </AnimatedG>
      <Path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" />
      <Path d="M2 21v-4" />
    </Svg>
  );
}

export { CctvIcon };
export type { CctvIconHandle };
