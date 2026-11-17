// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AArrowUpIcon} through. */
type AArrowUpIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far below its place the arrow comes in from, in the 24-unit viewBox: less than the web twin's 10, which starts it
 * past the canvas, which react-native-svg clips.
 */
const SHIFT = 6;

/** A stroke of the letter `drawn` of the way back in, scaled about its own middle at (6.5, `originY`). */
function letterIn(drawn: number, originY: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shown = interpolate(drawn, [0, 0.6], [0, 1], Extrapolation.CLAMP);
  const scale = 0.8 + 0.2 * shown;
  return { opacity: shown, ...transformProps({ scaleX: scale, scaleY: scale, originX: 6.5, originY }) };
}

/** The way out is quick, so the way back is what brings the letter and the arrow in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's a-arrow-up icon, whose letter fades in from four fifths of its size and whose arrow then fades in from
 * below, when started. Hidden from a screen reader: the control around it says what it does.
 */
function AArrowUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const bar = useAnimatedProps(() => letterIn(1 - progress.value, 13));
  const letter = useAnimatedProps(() => letterIn(1 - progress.value, 11));
  const arrow = useAnimatedProps(() => {
    const shown = interpolate(1 - progress.value, [0.4, 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: shown, ...transformProps({ y: SHIFT * (1 - shown) }) };
  });

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
      <AnimatedPath d="M3.304 13h6.392" animatedProps={bar} />
      <AnimatedPath d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" animatedProps={letter} />
      <AnimatedG animatedProps={arrow}>
        <Path d="M18 16V7" />
        <Path d="m14 11 4-4 4 4" />
      </AnimatedG>
    </Svg>
  );
}

export { AArrowUpIcon };
export type { AArrowUpIconHandle };
