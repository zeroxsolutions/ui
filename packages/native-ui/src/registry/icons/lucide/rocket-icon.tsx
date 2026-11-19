// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RocketIcon} through. */
type RocketIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Where the rocket is at each half of the way out, and its size about the middle: the web twin's first keyframes lift
 * it 3 and sway it 3 to the left, which would take it past the canvas, which react-native-svg clips, so it lifts and
 * sways by 2, shrinking a little.
 */
const LIFT = [0, -2, 0];
const SWAY = [0, 0, -2];
const SIZE = [1, 0.9, 0.9];

/**
 * The flame's first curve end and its smooth curve, at rest and at each half of the way out: the web twin's first
 * two flicker keyframes.
 */
const FLAME_END_X = [-2, -3, -2.2];
const FLAME_END_Y = [5, 5.5, 4.8];
const FLAME_SMOOTH = [
  [3.74, 4.74, 3.94],
  [-0.5, -1, -0.3],
  [5, 6, 5.2],
  [-2, -2.5, -1.8],
];

/** The flame's outline at `progress` of the way out. */
function flame(progress: number): { d: string } {
  'worklet';
  const at = (values: number[]): number => interpolate(progress, [0, 0.5, 1], values);
  const x = at(FLAME_END_X);
  const y = at(FLAME_END_Y);
  const [a, b, c, d] = FLAME_SMOOTH.map(at);
  return {
    d: `M4.5 16.5c-1.5 1.26 ${x} ${y} ${x} ${y}s${a} ${b} ${c} ${d}c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09`,
  };
}

/**
 * Lucide's rocket icon, which lifts and sways as its flame flickers when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function RocketIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const rocket = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], SIZE);
    return transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], SWAY),
      y: interpolate(progress.value, [0, 0.5, 1], LIFT),
      scaleX: size,
      scaleY: size,
    });
  });
  const fire = useAnimatedProps(() => flame(progress.value));

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
      <AnimatedG animatedProps={rocket}>
        <AnimatedPath
          d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"
          animatedProps={fire}
        />
        <Path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" />
        <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />
        <Path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </AnimatedG>
    </Svg>
  );
}

export { RocketIcon };
export type { RocketIconHandle };
