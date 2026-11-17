// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GripIcon} through. */
type GripIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The opacity of a dot that dims over its own stretch of the motion, beginning at `start`. */
function dot(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + 0.5], [1, 0.3], Extrapolation.CLAMP) };
}

/**
 * Lucide's grip icon, whose dots dim one after another and brighten again when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function GripIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const dot0 = useAnimatedProps(() => dot(progress.value, 0));
  const dot1 = useAnimatedProps(() => dot(progress.value, 0.06));
  const dot2 = useAnimatedProps(() => dot(progress.value, 0.12));
  const dot3 = useAnimatedProps(() => dot(progress.value, 0.18));
  const dot4 = useAnimatedProps(() => dot(progress.value, 0.24));
  const dot5 = useAnimatedProps(() => dot(progress.value, 0.3));
  const dot6 = useAnimatedProps(() => dot(progress.value, 0.36));
  const dot7 = useAnimatedProps(() => dot(progress.value, 0.42));
  const dot8 = useAnimatedProps(() => dot(progress.value, 0.48));

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
      <AnimatedCircle cx="19" cy="5" r="1" animatedProps={dot0} />
      <AnimatedCircle cx="19" cy="12" r="1" animatedProps={dot1} />
      <AnimatedCircle cx="12" cy="5" r="1" animatedProps={dot2} />
      <AnimatedCircle cx="19" cy="19" r="1" animatedProps={dot3} />
      <AnimatedCircle cx="12" cy="12" r="1" animatedProps={dot4} />
      <AnimatedCircle cx="5" cy="5" r="1" animatedProps={dot5} />
      <AnimatedCircle cx="12" cy="19" r="1" animatedProps={dot6} />
      <AnimatedCircle cx="5" cy="12" r="1" animatedProps={dot7} />
      <AnimatedCircle cx="5" cy="19" r="1" animatedProps={dot8} />
    </Svg>
  );
}

export { GripIcon };
export type { GripIconHandle };
