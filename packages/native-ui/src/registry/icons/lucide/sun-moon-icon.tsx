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
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SunMoonIcon} through. */
type SunMoonIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the rays in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * A ray, gone as soon as the way out begins, fading in on the way back as progress falls from `from` to `from - 0.5`:
 * the web twin's rays each fade in over 0.3 s, a tenth of a second after the last.
 */
function fadeIn(progress: number, from: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [from - 0.5, from], [1, 0], Extrapolation.CLAMP) };
}

/**
 * Lucide's sun-moon icon, whose moon and the sun's arc rock together while three of the sun's rays fade in again, one
 * after another, when started. Hidden from a screen reader: the control around it says what it does.
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
  const progress = useIconMotion(ref, TIMING);
  const moon = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -5, 5, -2, 2, 0]),
      originX: 9.5,
      originY: 14.5,
    }),
  );
  const first = useAnimatedProps(() => fadeIn(progress.value, 5 / 6));
  const second = useAnimatedProps(() => fadeIn(progress.value, 2 / 3));
  const third = useAnimatedProps(() => fadeIn(progress.value, 1 / 2));

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
      <AnimatedG animatedProps={moon}>
        <Path d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715" />
        <Path d="M16 12a4 4 0 0 0-4-4" />
      </AnimatedG>
      <AnimatedPath d="M12 2v2" animatedProps={first} />
      <AnimatedPath d="m19 5-1.256 1.256" animatedProps={second} />
      <AnimatedPath d="M20 12h2" animatedProps={third} />
    </Svg>
  );
}

export { SunMoonIcon };
export type { SunMoonIconHandle };
