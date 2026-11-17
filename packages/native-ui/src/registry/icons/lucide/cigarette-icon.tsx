// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CigaretteIcon} through. */
type CigaretteIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A wisp of smoke at `progress` through its `from` to `to` share of the motion: it sinks and fades out on the
 * way out, and rises back in, fading in, on the way back.
 */
function wisp(progress: number, from: number, to: number): IconTransformProps & { opacity: number } {
  'worklet';
  const sunk = interpolate(progress, [from, to], [0, 1], Extrapolation.CLAMP);
  return { opacity: 1 - sunk, ...transformProps({ y: 2 * sunk }) };
}

/**
 * Lucide's cigarette icon, whose two wisps of smoke sink and fade, the nearer first, and rise back in, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function CigaretteIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const near = useAnimatedProps(() => wisp(progress.value, 0, 0.8));
  const far = useAnimatedProps(() => wisp(progress.value, 0.2, 1));

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
      <Path d="M17 12H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14" />
      <AnimatedPath d="M18 8c0-2.5-2-2.5-2-5" animatedProps={near} />
      <Path d="M21 16a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <AnimatedPath d="M22 8c0-2.5-2-2.5-2-5" animatedProps={far} />
      <Path d="M7 12v4" />
    </Svg>
  );
}

export { CigaretteIcon };
export type { CigaretteIconHandle };
