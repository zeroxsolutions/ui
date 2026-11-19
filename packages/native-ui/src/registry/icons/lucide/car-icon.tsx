// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CarIcon} through. */
type CarIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/**
 * Each speed line: where it is drawn, from the canvas's left edge. The web twin starts them past that edge and slides
 * them 16 further left, past the canvas, which react-native-svg clips.
 */
const LINES = [
  { x1: 1, x2: 5, y: 8 },
  { x1: 1, x2: 6, y: 11 },
  { x1: 1, x2: 4, y: 14 },
];

/**
 * The speed line at `index` flicking out behind the car, each a tenth of the motion after the last: it fades in,
 * stretches out from the canvas's left edge and shrinks back, then fades out. Hidden at rest, and untransformed there,
 * since react-native-svg drops a shape's matrix from its first render.
 */
function streak(progress: number, index: number): IconTransformProps & { opacity: number } {
  'worklet';
  const line = LINES[index];
  const run = interpolate(progress, [0.1 * index, 0.1 * index + 0.8], [0, 1], Extrapolation.CLAMP);
  if (run === 0) return { opacity: 0, ...transformProps({}) };
  return {
    opacity: interpolate(run, [0, 0.2, 0.6, 1], [0, 0.7, 0.5, 0]),
    ...transformProps({
      scaleX: interpolate(run, [0, 0.2, 0.6, 1], [0.2, 1, 0.8, 0.3]),
      originX: line.x1,
      originY: line.y,
    }),
  };
}

/** A wheel's squash at `progress`, about its middle at `originX`. */
function squash(progress: number, originX: number): IconTransformProps {
  'worklet';
  const squashed = Math.sin(Math.PI * progress);
  return transformProps({ scaleX: 1 + 0.12 * squashed, scaleY: 1 - 0.1 * squashed, originX, originY: 17 });
}

/**
 * Lucide's car icon, which bounces twice while its wheels squash and speed lines flick out behind it, when started.
 * The speed lines are hidden at rest. Hidden from a screen reader: the control around it says what it does.
 */
function CarIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const body = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, [0, 0.5, 1], [0, -0.6, 0]) }));
  const backWheel = useAnimatedProps(() => squash(progress.value, 7));
  const frontWheel = useAnimatedProps(() => squash(progress.value, 17));
  const first = useAnimatedProps(() => streak(progress.value, 0));
  const second = useAnimatedProps(() => streak(progress.value, 1));
  const third = useAnimatedProps(() => streak(progress.value, 2));

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
      <AnimatedLine x1="1" x2="5" y1="8" y2="8" opacity={0} animatedProps={first} />
      <AnimatedLine x1="1" x2="6" y1="11" y2="11" opacity={0} animatedProps={second} />
      <AnimatedLine x1="1" x2="4" y1="14" y2="14" opacity={0} animatedProps={third} />
      <AnimatedG animatedProps={body}>
        <Path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <Path d="M9 17h6" />
      </AnimatedG>
      <AnimatedCircle cx="7" cy="17" r="2" animatedProps={backWheel} />
      <AnimatedCircle cx="17" cy="17" r="2" animatedProps={frontWheel} />
    </Svg>
  );
}

export { CarIcon };
export type { CarIconHandle };
