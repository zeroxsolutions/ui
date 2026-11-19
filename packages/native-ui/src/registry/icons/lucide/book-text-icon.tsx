// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BookTextIcon} through. */
type BookTextIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The rock, in degrees about the middle, at the start, two fifths of the way out and its end: the web twin's 8. */
const ROCK = [0, -8, 8];

/**
 * The book's size as it rocks: the web twin swells it to 1.04, which would take a corner past the canvas, which
 * react-native-svg clips, so it shrinks a little as it rocks.
 */
const SIZE = 0.94;

/**
 * Lucide's book-text icon, which shrinks slightly and rocks to one side and the other about its middle, then settles,
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function BookTextIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const book = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.4, 1], [1, SIZE, SIZE]);
    return transformProps({
      scaleX: size,
      scaleY: size,
      rotate: interpolate(progress.value, [0, 0.4, 1], ROCK),
    });
  });

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
      <AnimatedG animatedProps={book}>
        <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
        <Path d="M8 11h8" />
        <Path d="M8 7h6" />
      </AnimatedG>
    </Svg>
  );
}

export { BookTextIcon };
export type { BookTextIconHandle };
