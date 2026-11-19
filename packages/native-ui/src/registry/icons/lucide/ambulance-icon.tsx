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

/** The handle a control starts and stops {@link AmbulanceIcon} through. */
type AmbulanceIconHandle = IconHandle;

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
 * The speed line at `index` flicking out behind the ambulance, each a tenth of the motion after the last: it fades in,
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

/**
 * Lucide's ambulance icon, which bounces while its wheels turn, its cross dims and speed lines flick out behind it,
 * when started. The speed lines are hidden at rest. Hidden from a screen reader: the control around it says what it
 * does.
 */
function AmbulanceIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const body = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, [0, 0.5, 1], [0, -1, -0.5]) }));
  const cross = useAnimatedProps(() => ({ opacity: 1 - 0.7 * progress.value }));
  const backWheel = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value, originX: 7, originY: 18 }));
  const frontWheel = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value, originX: 17, originY: 18 }));
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
        <Path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <Path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14" />
        <Path d="M9 18h6" />
        <AnimatedG animatedProps={cross}>
          <Path d="M10 10H6" />
          <Path d="M8 8v4" />
        </AnimatedG>
        <AnimatedCircle cx="7" cy="18" r="2" animatedProps={backWheel} />
        <AnimatedCircle cx="17" cy="18" r="2" animatedProps={frontWheel} />
      </AnimatedG>
    </Svg>
  );
}

export { AmbulanceIcon };
export type { AmbulanceIconHandle };
