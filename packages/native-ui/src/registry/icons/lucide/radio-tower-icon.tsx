// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RadioTowerIcon} through. */
type RadioTowerIconHandle = IconHandle;

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
 * Lucide's radio-tower icon, whose waves fade out and back in from the inside outwards when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function RadioTowerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const outerLeft = useAnimatedProps(() => fadeIn(progress.value, 1 - FADE, 1));
  const innerLeft = useAnimatedProps(() => fadeIn(progress.value, 0, FADE));
  const innerRight = useAnimatedProps(() => fadeIn(progress.value, 0, FADE));
  const outerRight = useAnimatedProps(() => fadeIn(progress.value, 1 - FADE, 1));

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
      <AnimatedPath d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" animatedProps={outerLeft} />
      <AnimatedPath d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" animatedProps={innerLeft} />
      <Circle cx="12" cy="9" r="2" />
      <AnimatedPath d="M16.2 4.8c2 2 2.26 5.11.8 7.47" animatedProps={innerRight} />
      <AnimatedPath d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" animatedProps={outerRight} />
      <Path d="M9.5 18h5" />
      <Path d="m8 22 4-11 4 11" />
    </Svg>
  );
}

export { RadioTowerIcon };
export type { RadioTowerIconHandle };
