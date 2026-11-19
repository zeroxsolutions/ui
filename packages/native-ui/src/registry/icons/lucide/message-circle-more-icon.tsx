// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MessageCircleMoreIcon} through. */
type MessageCircleMoreIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what brings the dots back. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** How far into the way back each dot starts to come back after the one before it, and how long it takes. */
const STAGGER = 0.3;
const FADE = 0.4;

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's message-circle-more icon, whose dots go out together and come back one after another when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function MessageCircleMoreIcon({
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
      <Path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <AnimatedPath d="M8 12h.01" animatedProps={dot0} />
      <AnimatedPath d="M12 12h.01" animatedProps={dot1} />
      <AnimatedPath d="M16 12h.01" animatedProps={dot2} />
    </Svg>
  );
}

export { MessageCircleMoreIcon };
export type { MessageCircleMoreIconHandle };
