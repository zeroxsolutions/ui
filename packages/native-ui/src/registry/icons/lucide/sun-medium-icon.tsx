// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SunMediumIcon} through. */
type SunMediumIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each ray starts to fade in after the one before it, in the web twin's order, and how
 * long it takes: the web twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 0.1;
const FADE = 0.3;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's sun-medium icon, whose rays fade back in one after another when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function SunMediumIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const ray0 = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const ray1 = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const ray2 = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));
  const ray3 = useAnimatedProps(() => fadeIn(progress.value, 3 * STAGGER, 3 * STAGGER + FADE));
  const ray4 = useAnimatedProps(() => fadeIn(progress.value, 4 * STAGGER, 4 * STAGGER + FADE));
  const ray5 = useAnimatedProps(() => fadeIn(progress.value, 5 * STAGGER, 5 * STAGGER + FADE));
  const ray6 = useAnimatedProps(() => fadeIn(progress.value, 6 * STAGGER, 6 * STAGGER + FADE));
  const ray7 = useAnimatedProps(() => fadeIn(progress.value, 7 * STAGGER, 7 * STAGGER + FADE));

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
      <Circle cx="12" cy="12" r="4" />
      <AnimatedPath d="M12 3v1" animatedProps={ray0} />
      <AnimatedPath d="M12 20v1" animatedProps={ray1} />
      <AnimatedPath d="M3 12h1" animatedProps={ray2} />
      <AnimatedPath d="M20 12h1" animatedProps={ray3} />
      <AnimatedPath d="m18.364 5.636-.707.707" animatedProps={ray4} />
      <AnimatedPath d="m6.343 17.657-.707.707" animatedProps={ray5} />
      <AnimatedPath d="m5.636 5.636.707.707" animatedProps={ray6} />
      <AnimatedPath d="m17.657 17.657.707.707" animatedProps={ray7} />
    </Svg>
  );
}

export { SunMediumIcon };
export type { SunMediumIconHandle };
