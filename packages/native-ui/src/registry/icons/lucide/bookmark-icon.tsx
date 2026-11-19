// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BookmarkIcon} through. */
type BookmarkIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's bookmark icon, whose ribbon stretches tall and narrow, then squashes wide, about its middle, then settles,
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function BookmarkIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // A stretch of 1.2, less than the web twin's 1.3, which takes the top past the canvas, which react-native-svg clips.
  const ribbon = useAnimatedProps(() =>
    transformProps({
      scaleX: interpolate(progress.value, [0, 0.5, 1], [1, 0.9, 1.1]),
      scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 1.2, 0.9]),
    }),
  );

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
      <AnimatedPath
        d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"
        animatedProps={ribbon}
      />
    </Svg>
  );
}

export { BookmarkIcon };
export type { BookmarkIconHandle };
