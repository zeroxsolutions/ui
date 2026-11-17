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

/** The handle a control starts and stops {@link TruckIcon} through. */
type TruckIconHandle = IconHandle;

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

/** How far the truck rises at each half of the way out: the web twin's first keyframes. */
const BOUNCE = [0, -1, 0];

/**
 * The speed line at `index` flicking out behind the truck, each a tenth of the motion after the last: it fades in,
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

/** A wheel's turn at `progress`, about its middle at `originX`. */
function wheel(progress: number, originX: number): IconTransformProps {
  'worklet';
  return transformProps({ rotate: 360 * progress, originX, originY: 18 });
}

/**
 * Lucide's truck icon, which bounces twice while its wheels turn and speed lines flick out behind it when started. The
 * speed lines and the spokes are hidden at rest. Hidden from a screen reader: the control around it says what it does.
 */
function TruckIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const body = useAnimatedProps(() => transformProps({ y: interpolate(progress.value, [0, 0.5, 1], BOUNCE) }));
  const backWheel = useAnimatedProps(() => wheel(progress.value, 7));
  const frontWheel = useAnimatedProps(() => wheel(progress.value, 17));
  const backSpokes = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
  }));
  const frontSpokes = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
  }));
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
        <Path d="M15 18H9" />
        <Path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <AnimatedG animatedProps={backWheel}>
          <Circle cx="7" cy="18" r="2" />
          <AnimatedG opacity={0} strokeWidth={1.5} animatedProps={backSpokes}>
            <Line x1="7" x2="7" y1="16.5" y2="19.5" />
            <Line x1="5.5" x2="8.5" y1="18" y2="18" />
          </AnimatedG>
        </AnimatedG>
        <AnimatedG animatedProps={frontWheel}>
          <Circle cx="17" cy="18" r="2" />
          <AnimatedG opacity={0} strokeWidth={1.5} animatedProps={frontSpokes}>
            <Line x1="17" x2="17" y1="16.5" y2="19.5" />
            <Line x1="15.5" x2="18.5" y1="18" y2="18" />
          </AnimatedG>
        </AnimatedG>
      </AnimatedG>
    </Svg>
  );
}

export { TruckIcon };
export type { TruckIconHandle };
