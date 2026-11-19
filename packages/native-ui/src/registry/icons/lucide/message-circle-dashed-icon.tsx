// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MessageCircleDashedIcon} through. */
type MessageCircleDashedIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each dash starts to fade in after the one before it, and how long it takes: the web
 * twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 0.1;
const FADE = 0.3;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's message-circle-dashed icon, whose dashes fade back in clockwise, one after another when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function MessageCircleDashedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const segment0 = useAnimatedProps(() => fadeIn(progress.value, 0 * STAGGER, 0 * STAGGER + FADE));
  const segment1 = useAnimatedProps(() => fadeIn(progress.value, 1 * STAGGER, 1 * STAGGER + FADE));
  const segment2 = useAnimatedProps(() => fadeIn(progress.value, 2 * STAGGER, 2 * STAGGER + FADE));
  const segment3 = useAnimatedProps(() => fadeIn(progress.value, 3 * STAGGER, 3 * STAGGER + FADE));
  const segment4 = useAnimatedProps(() => fadeIn(progress.value, 4 * STAGGER, 4 * STAGGER + FADE));
  const segment5 = useAnimatedProps(() => fadeIn(progress.value, 5 * STAGGER, 5 * STAGGER + FADE));
  const segment6 = useAnimatedProps(() => fadeIn(progress.value, 6 * STAGGER, 6 * STAGGER + FADE));
  const segment7 = useAnimatedProps(() => fadeIn(progress.value, 7 * STAGGER, 7 * STAGGER + FADE));

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
      <AnimatedPath d="M10.1 2.182a10 10 0 0 1 3.8 0" animatedProps={segment0} />
      <AnimatedPath d="M17.609 3.72a10 10 0 0 1 2.69 2.7" animatedProps={segment1} />
      <AnimatedPath d="M21.818 10.1a10 10 0 0 1 0 3.8" animatedProps={segment2} />
      <AnimatedPath d="M20.28 17.61a10 10 0 0 1-2.7 2.69" animatedProps={segment3} />
      <AnimatedPath d="M13.9 21.818a10 10 0 0 1-3.8 0" animatedProps={segment4} />
      <AnimatedPath d="m6.163 21.117-2.906.85a1 1 0 0 1-1.236-1.169l.965-2.98" animatedProps={segment5} />
      <AnimatedPath d="M2.182 13.9a10 10 0 0 1 0-3.8" animatedProps={segment6} />
      <AnimatedPath d="M3.721 6.391a10 10 0 0 1 2.7-2.69" animatedProps={segment7} />
    </Svg>
  );
}

export { MessageCircleDashedIcon };
export type { MessageCircleDashedIconHandle };
