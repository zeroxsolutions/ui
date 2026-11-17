// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RouterIcon} through. */
type RouterIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back the outer wave starts to fade in after the inner, and how long each takes.
 */
const STAGGER = 0.3;
const FADE = 0.7;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's router icon, whose signal fades out and back in from the inside outwards when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function RouterIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const inner = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const outer = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));

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
      <Rect width="20" height="8" x="2" y="14" rx="2" />
      <Path d="M6.01 18H6" />
      <Path d="M10.01 18H10" />
      <Path d="M15 10v4" />
      <AnimatedPath d="M17.84 7.17a4 4 0 0 0-5.66 0" animatedProps={inner} />
      <AnimatedPath d="M20.66 4.34a8 8 0 0 0-11.31 0" animatedProps={outer} />
    </Svg>
  );
}

export { RouterIcon };
export type { RouterIconHandle };
