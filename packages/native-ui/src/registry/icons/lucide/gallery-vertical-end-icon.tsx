// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GalleryVerticalEndIcon} through. */
type GalleryVerticalEndIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what slides the cards in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * The move and opacity of a card `depth` cards behind the front one, sliding in from `2 * depth` below over its
 * own stretch of the way back, from `start` to `end` of it.
 */
function card(progress: number, depth: number, start: number, end: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shown = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ y: 2 * depth * (1 - shown) }), opacity: shown };
}

/**
 * Lucide's gallery-vertical-end icon, whose cards behind the front one slide in from behind it, the nearer first when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function GalleryVerticalEndIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const near = useAnimatedProps(() => card(progress.value, 2, 0, 0.6));
  const far = useAnimatedProps(() => card(progress.value, 1, 0.4, 1));

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
      <AnimatedPath d="M7 2h10" animatedProps={far} />
      <AnimatedPath d="M5 6h14" animatedProps={near} />
      <Rect width="18" height="12" x="3" y="10" rx="2" />
    </Svg>
  );
}

export { GalleryVerticalEndIcon };
export type { GalleryVerticalEndIconHandle };
