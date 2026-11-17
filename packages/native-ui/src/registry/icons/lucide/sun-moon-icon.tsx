// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SunMoonIcon} through. */
type SunMoonIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A ray fading out once `delay` of the way in has passed. */
function fade(progress: number, delay: number): { opacity: number } {
  'worklet';
  return { opacity: 1 - interpolate(progress, [delay, 1], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's sun-moon icon, whose moon rocks while three of the sun's rays fade, one after another, then
 * return, when started. Hidden from a screen reader: the control around it says what it does.
 */
function SunMoonIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const moon = useAnimatedProps(() => ({
    ...transformProps({
      rotate: interpolate(progress.value, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -5, 5, -2, 2, 0]),
      originX: 10,
      originY: 13,
    }),
  }));
  const first = useAnimatedProps(() => fade(progress.value, 0));
  const second = useAnimatedProps(() => fade(progress.value, 0.15));
  const third = useAnimatedProps(() => fade(progress.value, 0.3));

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
      <AnimatedPath
        d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715"
        animatedProps={moon}
      />
      <AnimatedPath d="M12 2v2" animatedProps={first} />
      <Path d="M16 12a4 4 0 0 0-4-4" />
      <AnimatedPath d="m19 5-1.256 1.256" animatedProps={second} />
      <AnimatedPath d="M20 12h2" animatedProps={third} />
    </Svg>
  );
}

export { SunMoonIcon };
export type { SunMoonIconHandle };
