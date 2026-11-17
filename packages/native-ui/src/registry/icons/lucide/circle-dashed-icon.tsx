// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CircleDashedIcon} through. */
type CircleDashedIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of the dash `index` at `progress`, each fading in a little after the last. */
function segment(progress: number, index: number): { opacity: number } {
  'worklet';
  const start = (index + 1) / 11;
  return { opacity: interpolate(1 - progress, [start, start + 3 / 11], [0, 1], Extrapolation.CLAMP) };
}

/** The way out is quick, so the way back is what fades the dashes in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's circle-dashed icon, whose dashes vanish and fade back in one after another when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CircleDashedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const first = useAnimatedProps(() => segment(progress.value, 0));
  const second = useAnimatedProps(() => segment(progress.value, 1));
  const third = useAnimatedProps(() => segment(progress.value, 2));
  const fourth = useAnimatedProps(() => segment(progress.value, 3));
  const fifth = useAnimatedProps(() => segment(progress.value, 4));
  const sixth = useAnimatedProps(() => segment(progress.value, 5));
  const seventh = useAnimatedProps(() => segment(progress.value, 6));
  const eighth = useAnimatedProps(() => segment(progress.value, 7));

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
      <AnimatedPath d="M10.1 2.182a10 10 0 0 1 3.8 0" animatedProps={first} />
      <AnimatedPath d="M13.9 21.818a10 10 0 0 1-3.8 0" animatedProps={second} />
      <AnimatedPath d="M17.609 3.721a10 10 0 0 1 2.69 2.7" animatedProps={third} />
      <AnimatedPath d="M2.182 13.9a10 10 0 0 1 0-3.8" animatedProps={fourth} />
      <AnimatedPath d="M20.279 17.609a10 10 0 0 1-2.7 2.69" animatedProps={fifth} />
      <AnimatedPath d="M21.818 10.1a10 10 0 0 1 0 3.8" animatedProps={sixth} />
      <AnimatedPath d="M3.721 6.391a10 10 0 0 1 2.7-2.69" animatedProps={seventh} />
      <AnimatedPath d="M6.391 20.279a10 10 0 0 1-2.69-2.7" animatedProps={eighth} />
    </Svg>
  );
}

export { CircleDashedIcon };
export type { CircleDashedIconHandle };
