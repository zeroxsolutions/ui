// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTransformProps,
  type IconHandle,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CoffeeIcon} through. */
type CoffeeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A wisp of steam `delay` of the way in, rising 0.9 while it fades: less than the web twin's 3, which takes it
 * past the canvas, which react-native-svg clips.
 */
function wisp(progress: number, delay: number): { opacity: number } & IconTransformProps {
  'worklet';
  const rise = interpolate(progress, [delay, 1], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ y: -0.9 * rise }), opacity: 1 - rise };
}

/**
 * Lucide's coffee icon, whose three wisps of steam rise and fade, one after another, then return when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function CoffeeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() => wisp(progress.value, 0));
  const middle = useAnimatedProps(() => wisp(progress.value, 0.15));
  const right = useAnimatedProps(() => wisp(progress.value, 0.3));

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
      <AnimatedPath d="M6 2v2" animatedProps={left} />
      <AnimatedPath d="M10 2v2" animatedProps={middle} />
      <AnimatedPath d="M14 2v2" animatedProps={right} />
      <Path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
    </Svg>
  );
}

export { CoffeeIcon };
export type { CoffeeIconHandle };
