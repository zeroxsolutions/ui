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

/** The handle a control starts and stops {@link SunsetIcon} through. */
type SunsetIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each ray starts to fade in after the one before it, and how long it takes: the web
 * twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 1 / 7;
const FADE = 3 / 7;

/** How far the arrow dips: the web twin's. */
const DIP = 1;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's sunset icon, whose arrow dips as its rays and horizon fade back in one after another when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function SunsetIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const arrow = useAnimatedProps(() => transformProps({ y: DIP * progress.value }));
  const ray0 = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const ray1 = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const ray2 = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));
  const ray3 = useAnimatedProps(() => fadeIn(progress.value, 3 * STAGGER, 3 * STAGGER + FADE));
  const ray4 = useAnimatedProps(() => fadeIn(progress.value, 4 * STAGGER, 4 * STAGGER + FADE));

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
      <AnimatedG animatedProps={arrow}>
        <Path d="M12 10V2" />
        <Path d="m16 6-4 4-4-4" />
      </AnimatedG>
      <AnimatedPath d="m4.93 10.93 1.41 1.41" animatedProps={ray0} />
      <AnimatedPath d="M2 18h2" animatedProps={ray1} />
      <AnimatedPath d="M20 18h2" animatedProps={ray2} />
      <AnimatedPath d="m19.07 10.93-1.41 1.41" animatedProps={ray3} />
      <AnimatedPath d="M22 22H2" animatedProps={ray4} />
      <Path d="M16 18a4 4 0 0 0-8 0" />
    </Svg>
  );
}

export { SunsetIcon };
export type { SunsetIconHandle };
