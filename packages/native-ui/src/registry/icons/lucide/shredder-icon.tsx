// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShredderIcon} through. */
type ShredderIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the page is at each third of the way out: the web twin's first keyframes. */
const SHAKE = [0, 1.5, -1.5, 1];

/**
 * How far each shred falls as it fades: the web twin's 3 would take the longest past the canvas, which
 * react-native-svg clips, so they fall by 1.
 */
const FALL = 1;

/** How far into the way out each shred starts to fall after the one before it, and how long it takes. */
const STAGGER = 0.1;
const SPAN = 0.7;

/** The place and opacity of the shred that starts to fall `start` of the way out. */
function shred(progress: number, start: number): IconTransformProps & { opacity: number } {
  'worklet';
  const fallen = interpolate(progress, [start, start + SPAN], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ y: FALL * fallen }), opacity: 1 - fallen };
}

/**
 * Lucide's shredder icon, whose page shakes as its shreds fall and fade, and come back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ShredderIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const page = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], SHAKE) }));
  const first = useAnimatedProps(() => shred(progress.value, 0));
  const second = useAnimatedProps(() => shred(progress.value, STAGGER));
  const third = useAnimatedProps(() => shred(progress.value, 2 * STAGGER));
  const fourth = useAnimatedProps(() => shred(progress.value, 3 * STAGGER));

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
      <AnimatedG animatedProps={page}>
        <Path d="M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5" />
        <Path d="M14 2v5a1 1 0 0 0 1 1h5" />
      </AnimatedG>
      <AnimatedPath d="M10 22v-5" animatedProps={second} />
      <AnimatedPath d="M14 19v-2" animatedProps={third} />
      <AnimatedPath d="M18 20v-3" animatedProps={fourth} />
      <Path d="M2 13h20" />
      <AnimatedPath d="M6 20v-3" animatedProps={first} />
    </Svg>
  );
}

export { ShredderIcon };
export type { ShredderIconHandle };
