// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GripHorizontalIcon} through. */
type GripHorizontalIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The size and opacity of the dot at (`x`, `y`), which shrinks and dims about its middle over its own stretch of
 * the motion, beginning at `start`.
 */
function dot(progress: number, x: number, y: number, start: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shrunk = interpolate(progress, [start, start + 0.5], [0, 1], Extrapolation.CLAMP);
  const scale = 1 - 0.15 * shrunk;
  return { ...transformProps({ scaleX: scale, scaleY: scale, originX: x, originY: y }), opacity: 1 - 0.6 * shrunk };
}

/**
 * Lucide's grip-horizontal icon, whose dots shrink and dim one after another, row by row, and come back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function GripHorizontalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const dot0 = useAnimatedProps(() => dot(progress.value, 5, 9, 0));
  const dot1 = useAnimatedProps(() => dot(progress.value, 12, 9, 0.1));
  const dot2 = useAnimatedProps(() => dot(progress.value, 19, 9, 0.2));
  const dot3 = useAnimatedProps(() => dot(progress.value, 5, 15, 0.16));
  const dot4 = useAnimatedProps(() => dot(progress.value, 12, 15, 0.26));
  const dot5 = useAnimatedProps(() => dot(progress.value, 19, 15, 0.36));

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
      <AnimatedCircle cx="5" cy="9" r="1" animatedProps={dot0} />
      <AnimatedCircle cx="12" cy="9" r="1" animatedProps={dot1} />
      <AnimatedCircle cx="19" cy="9" r="1" animatedProps={dot2} />
      <AnimatedCircle cx="5" cy="15" r="1" animatedProps={dot3} />
      <AnimatedCircle cx="12" cy="15" r="1" animatedProps={dot4} />
      <AnimatedCircle cx="19" cy="15" r="1" animatedProps={dot5} />
    </Svg>
  );
}

export { GripHorizontalIcon };
export type { GripHorizontalIconHandle };
