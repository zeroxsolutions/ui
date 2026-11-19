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

/** The handle a control starts and stops {@link GalleryHorizontalEndIcon} through. */
type GalleryHorizontalEndIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what slides the cards in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/**
 * The move and opacity of a card `depth` cards behind the front one, sliding in from `2 * depth` to the right over
 * its own stretch of the way back, from `start` to `end` of it.
 */
function card(progress: number, depth: number, start: number, end: number): IconTransformProps & { opacity: number } {
  'worklet';
  const shown = interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ x: 2 * depth * (1 - shown) }), opacity: shown };
}

/**
 * Lucide's gallery-horizontal-end icon, whose cards behind the front one slide in from behind it, the nearer first when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function GalleryHorizontalEndIcon({
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
      <AnimatedPath d="M2 7v10" animatedProps={far} />
      <AnimatedPath d="M6 5v14" animatedProps={near} />
      <Rect width="12" height="18" x="10" y="3" rx="2" />
    </Svg>
  );
}

export { GalleryHorizontalEndIcon };
export type { GalleryHorizontalEndIconHandle };
