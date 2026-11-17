// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BookmarkMinusIcon} through. */
type BookmarkMinusIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the minus, in the 24-unit viewBox. */
const MINUS = 6;

/**
 * Lucide's bookmark-minus icon, whose ribbon stretches tall and narrow, then squashes wide, about its middle, while its
 * minus is taken away and drawn in again, when started. Hidden from a screen reader: the control around it says what it
 * does.
 */
function BookmarkMinusIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const ribbon = useAnimatedProps(() =>
    transformProps({
      scaleX: interpolate(progress.value, [0, 0.5, 1], [1, 0.9, 1.1]),
      scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 1.3, 0.9]),
    }),
  );
  const minus = useAnimatedProps(() => dash(MINUS, interpolate(progress.value, [0.5, 1], [1, 0], Extrapolation.CLAMP)));

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
      <AnimatedPath d="M15 10H9" animatedProps={minus} />
    </Svg>
  );
}

export { BookmarkMinusIcon };
export type { BookmarkMinusIconHandle };
