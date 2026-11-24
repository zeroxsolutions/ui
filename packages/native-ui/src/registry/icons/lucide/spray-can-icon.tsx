// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SprayCanIcon} through. */
type SprayCanIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each dot starts to come back after the one before it, nearest the nozzle first, and
 * how long it takes: the web twin's 0.07 s stagger, in proportion.
 */
const STAGGER = 0.12;
const FADE = 0.4;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's spray-can icon, whose spray goes out and comes back from the nozzle outwards when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function SprayCanIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const dot0 = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const dot1 = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const dot2 = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));
  const dot3 = useAnimatedProps(() => fadeIn(progress.value, 3 * STAGGER, 3 * STAGGER + FADE));
  const dot4 = useAnimatedProps(() => fadeIn(progress.value, 4 * STAGGER, 4 * STAGGER + FADE));

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
      <Path d="M18 8.172V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v3.172" />
      <Path d="M14 6h-2" />
      <Path d="M20 20a2 2 0 01-2 2h-4a2 2 0 01-2-2v-9a3 3 0 013-3h2a3 3 0 013 3z" />
      <Path d="m20 11-8 3" />
      <Path d="m12 19 8-3" />
      <AnimatedPath d="M8 4h.01" animatedProps={dot0} />
      <AnimatedPath d="M8 8h.01" animatedProps={dot1} />
      <AnimatedPath d="M4 2h.01" animatedProps={dot2} />
      <AnimatedPath d="M4 6h.01" animatedProps={dot3} />
      <AnimatedPath d="M4 10h.01" animatedProps={dot4} />
    </Svg>
  );
}

export { SprayCanIcon };
export type { SprayCanIconHandle };
