// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MessageSquareDashedIcon} through. */
type MessageSquareDashedIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the parts in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * How far into the way back each dash starts to fade in after the one before it, and how long it takes: the web
 * twin's 0.1 and 0.3 s, in proportion.
 */
const STAGGER = 1 / 12;
const FADE = 0.25;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's message-square-dashed icon, whose dashes fade back in clockwise, one after another when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function MessageSquareDashedIcon({
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
  const segment8 = useAnimatedProps(() => fadeIn(progress.value, 8 * STAGGER, 8 * STAGGER + FADE));
  const segment9 = useAnimatedProps(() => fadeIn(progress.value, 9 * STAGGER, 9 * STAGGER + FADE));

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
      <AnimatedPath d="M14 3h2" animatedProps={segment0} />
      <AnimatedPath d="M16 19h-2" animatedProps={segment1} />
      <AnimatedPath d="M8 19h2" animatedProps={segment2} />
      <AnimatedPath d="M2 16v5.286a.71.71 0 0 0 1.212.502l1.149-1.149" animatedProps={segment3} />
      <AnimatedPath d="M8 3h2" animatedProps={segment4} />
      <AnimatedPath d="M22 6V5a2 2 0 0 0-2-2" animatedProps={segment5} />
      <AnimatedPath d="M2 12v-2" animatedProps={segment6} />
      <AnimatedPath d="M22 10v2" animatedProps={segment7} />
      <AnimatedPath d="M20 19a2 2 0 0 0 2-2v-1" animatedProps={segment8} />
      <AnimatedPath d="M4 3a2 2 0 0 0-2 2v1" animatedProps={segment9} />
    </Svg>
  );
}

export { MessageSquareDashedIcon };
export type { MessageSquareDashedIconHandle };
