// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ThumbsDownIcon} through. */
type ThumbsDownIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Where the thumb goes, how far it turns about the middle and its size there: the web twin's move and turn, which would
 * take the thumb's tip past the canvas, which react-native-svg clips, so it shrinks a little as it goes.
 */
const SHIFT_X = -1;
const SHIFT_Y = 2;
const TURN = -12;
const SIZE = 0.92;

/**
 * Lucide's thumbs-down icon, which tips down and to the left, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ThumbsDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      x: SHIFT_X * progress.value,
      y: SHIFT_Y * progress.value,
      rotate: TURN * progress.value,
      scaleX: 1 - (1 - SIZE) * progress.value,
      scaleY: 1 - (1 - SIZE) * progress.value,
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
      <AnimatedG animatedProps={whole}>
        <Path d="M17 14V2" />
        <Path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
      </AnimatedG>
    </Svg>
  );
}

export { ThumbsDownIcon };
export type { ThumbsDownIconHandle };
