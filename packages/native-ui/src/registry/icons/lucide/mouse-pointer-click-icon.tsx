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

/** The handle a control starts and stops {@link MousePointerClickIcon} through. */
type MousePointerClickIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the pointer is at each half of the way out: lifted, then pressed down and to the left. */
const LIFT_X = [0, 0, -3];
const LIFT_Y = [0, -4, 0];

/** How far each click line bursts out from the pointer, in the 24-unit viewBox: the web twin's. */
const BURST = 1;

/**
 * The place and opacity of a click line that goes out as the pointer lifts and comes back as it clicks, bursting
 * out by (`x`, `y`).
 */
function burst(progress: number, x: number, y: number): IconTransformProps & { opacity: number } {
  'worklet';
  const out = interpolate(progress, [0.5, 1], [0, 1], Extrapolation.CLAMP);
  return {
    ...transformProps({ x: x * out, y: y * out }),
    opacity: interpolate(progress, [0, 0.25, 0.5, 1], [1, 0, 0, 1], Extrapolation.CLAMP),
  };
}

/**
 * Lucide's mouse-pointer-click icon, whose pointer lifts and clicks, its click lines bursting out when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function MousePointerClickIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const pointer = useAnimatedProps(() =>
    transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], LIFT_X),
      y: interpolate(progress.value, [0, 0.5, 1], LIFT_Y),
    }),
  );
  const upperRight = useAnimatedProps(() => burst(progress.value, BURST, -BURST));
  const left = useAnimatedProps(() => burst(progress.value, -BURST, 0));
  const lowerLeft = useAnimatedProps(() => burst(progress.value, -BURST, BURST));
  const top = useAnimatedProps(() => burst(progress.value, 0, -BURST));

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
      <AnimatedPath d="M14 4.1 12 6" animatedProps={upperRight} />
      <AnimatedPath d="m5.1 8-2.9-.8" animatedProps={left} />
      <AnimatedPath d="m6 12-1.9 2" animatedProps={lowerLeft} />
      <AnimatedPath d="M7.2 2.2 8 5.1" animatedProps={top} />
      <AnimatedPath
        d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
        animatedProps={pointer}
      />
    </Svg>
  );
}

export { MousePointerClickIcon };
export type { MousePointerClickIconHandle };
