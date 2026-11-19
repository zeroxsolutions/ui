// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CupSodaIcon} through. */
type CupSodaIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A bubble at (`cx`, `cy`) rising over its own stretch of the motion from `start`: it shows, floats up and shrinks
 * as it fades out. It is hidden at rest.
 */
function bubble(progress: number, start: number, cx: number, cy: number): IconTransformProps & { opacity: number } {
  'worklet';
  const rise = interpolate(progress, [start, start + 0.6], [0, 1], Extrapolation.CLAMP);
  const scale = interpolate(rise, [0, 0.08, 0.7, 1], [1, 1, 0.85, 0.6]);
  return {
    opacity: interpolate(rise, [0, 0.08, 0.7, 1], [0, 0.9, 0.4, 0]),
    ...transformProps({
      y: interpolate(rise, [0, 0.08, 0.7, 1], [0, -3, -10, -14]),
      scaleX: scale,
      scaleY: scale,
      originX: cx,
      originY: cy,
    }),
  };
}

/**
 * Lucide's cup-soda icon, whose straw bobs while the soda's surface rises and bubbles float up through it, fading when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function CupSodaIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // A lift of 0.6, less than the web twin's 0.85, which takes the straw's top past the canvas, which react-native-svg
  // clips.
  const straw = useAnimatedProps(() =>
    transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], [0, -0.6, 0.15]),
      scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 1.06, 0.99]),
      originX: 13.5,
      originY: 8,
    }),
  );
  const surface = useAnimatedProps(() => transformProps({ y: -progress.value }));
  const bubble0 = useAnimatedProps(() => bubble(progress.value, 0, 8.25, 20.5));
  const bubble1 = useAnimatedProps(() => bubble(progress.value, 0.13, 11.25, 19.5));
  const bubble2 = useAnimatedProps(() => bubble(progress.value, 0.27, 14, 20.75));
  const bubble3 = useAnimatedProps(() => bubble(progress.value, 0.4, 9.75, 19));
  const bubble4 = useAnimatedProps(() => bubble(progress.value, 0.21, 12.5, 20));

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
      <Path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" />
      <Path d="M5 8h14" />
      <AnimatedPath d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" animatedProps={surface} />
      <AnimatedPath d="m12 8 1-6h2" animatedProps={straw} />
      <AnimatedCircle cx="8.25" cy="20.5" r="0.75" fill={color} stroke="none" animatedProps={bubble0} />
      <AnimatedCircle cx="11.25" cy="19.5" r="0.6" fill={color} stroke="none" animatedProps={bubble1} />
      <AnimatedCircle cx="14" cy="20.75" r="0.6" fill={color} stroke="none" animatedProps={bubble2} />
      <AnimatedCircle cx="9.75" cy="19" r="0.75" fill={color} stroke="none" animatedProps={bubble3} />
      <AnimatedCircle cx="12.5" cy="20" r="0.45" fill={color} stroke="none" animatedProps={bubble4} />
    </Svg>
  );
}

export { CupSodaIcon };
export type { CupSodaIconHandle };
