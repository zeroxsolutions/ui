// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GalleryThumbnailsIcon} through. */
type GalleryThumbnailsIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The way out is quick, so the way back is what fades the thumbnails in. */
const TIMING: IconTiming = { outEasing: Easing.out(Easing.exp) };

/** The opacity of a part that fades in over its own stretch of the way back, from `start` to `end` of it. */
function fadeIn(progress: number, start: number, end: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(1 - progress, [start, end], [0, 1], Extrapolation.CLAMP) };
}

/**
 * Lucide's gallery-thumbnails icon, whose thumbnails fade in again one after another when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function GalleryThumbnailsIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const thumb0 = useAnimatedProps(() => fadeIn(progress.value, 0, 0.4));
  const thumb1 = useAnimatedProps(() => fadeIn(progress.value, 0.2, 0.6));
  const thumb2 = useAnimatedProps(() => fadeIn(progress.value, 0.4, 0.8));
  const thumb3 = useAnimatedProps(() => fadeIn(progress.value, 0.6, 1));

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
      <Rect width="18" height="14" x="3" y="3" rx="2" />
      <AnimatedPath d="M4 21h1" animatedProps={thumb0} />
      <AnimatedPath d="M9 21h1" animatedProps={thumb1} />
      <AnimatedPath d="M14 21h1" animatedProps={thumb2} />
      <AnimatedPath d="M19 21h1" animatedProps={thumb3} />
    </Svg>
  );
}

export { GalleryThumbnailsIcon };
export type { GalleryThumbnailsIconHandle };
