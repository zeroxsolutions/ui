// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HeartPulseIcon} through. */
type HeartPulseIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what traces the pulse and draws the heart in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The length of the heart, in the 24-unit viewBox. */
const HEART = 59.04;

/** The length of the pulse line, in the 24-unit viewBox. */
const PULSE = 28.68;

/** How much the heart grows as it beats. */
const BEAT = 0.08;

/**
 * The stroke of a part `length` units long, drawn in over its own stretch of the way back, from `start` to `end`
 * of it, beginning at its far end when `fromEnd`.
 */
function drawIn(
  progress: number,
  length: number,
  start: number,
  end: number,
  fromEnd = false,
): ReturnType<typeof dash> {
  'worklet';
  const drawn = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return dash(length, drawn, fromEnd ? 1 - drawn : 0);
}

/**
 * Lucide's heart-pulse icon, whose pulse line is traced, then the heart drawn in and beating once when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function HeartPulseIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const beat = useAnimatedProps(() => {
    const scale = 1 + BEAT * interpolate(1 - progress.value, [0.8, 0.9, 1], [0, 1, 0], Extrapolation.CLAMP);
    return transformProps({ scaleX: scale, scaleY: scale });
  });
  const heart = useAnimatedProps(() => drawIn(progress.value, HEART, 0.4, 0.8));
  const pulse = useAnimatedProps(() => drawIn(progress.value, PULSE, 0, 0.45, true));

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
      <AnimatedG animatedProps={beat}>
        <AnimatedPath
          d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"
          animatedProps={heart}
        />
      </AnimatedG>
      <AnimatedPath d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" animatedProps={pulse} />
    </Svg>
  );
}

export { HeartPulseIcon };
export type { HeartPulseIconHandle };
