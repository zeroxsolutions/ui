// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RadioIcon} through. */
type RadioIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** How long each wave takes to fade in over the way back; the outer ones end it, the inner ones begin it. */
const FADE = 0.6;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's radio icon, whose waves fade out and back in from the inside outwards when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function RadioIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const innerRight = useAnimatedProps(() => fadeIn(progress.value, 0, FADE));
  const outerRight = useAnimatedProps(() => fadeIn(progress.value, 1 - FADE, 1));
  const outerLeft = useAnimatedProps(() => fadeIn(progress.value, 1 - FADE, 1));
  const innerLeft = useAnimatedProps(() => fadeIn(progress.value, 0, FADE));

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
      <AnimatedPath d="M16.247 7.761a6 6 0 0 1 0 8.478" animatedProps={innerRight} />
      <AnimatedPath d="M19.075 4.933a10 10 0 0 1 0 14.134" animatedProps={outerRight} />
      <AnimatedPath d="M4.925 19.067a10 10 0 0 1 0-14.134" animatedProps={outerLeft} />
      <AnimatedPath d="M7.753 16.239a6 6 0 0 1 0-8.478" animatedProps={innerLeft} />
      <Circle cx="12" cy="12" r="2" />
    </Svg>
  );
}

export { RadioIcon };
export type { RadioIconHandle };
