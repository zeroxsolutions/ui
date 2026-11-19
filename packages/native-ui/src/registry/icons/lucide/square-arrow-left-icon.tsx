// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SquareArrowLeftIcon} through. */
type SquareArrowLeftIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the head steps back and how long the shaft is at the far end of the way out: the web twin's. */
const STEP = 3;
const SHAFT = 8;
const SHAFT_LEFT = 5;

/**
 * Lucide's square-arrow-left icon, whose arrow pulls back to the right and springs out again when started. Hidden from
 * a screen reader: the control around it says what it does.
 */
function SquareArrowLeftIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const head = useAnimatedProps(() => transformProps({ x: STEP * progress.value }));
  const shaft = useAnimatedProps(() => dash(SHAFT, 1 - ((SHAFT - SHAFT_LEFT) / SHAFT) * progress.value));

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
      <Rect width="18" height="18" x="3" y="3" rx="2" />
      <AnimatedPath d="m12 8-4 4 4 4" animatedProps={head} />
      <AnimatedPath d="M16 12H8" animatedProps={shaft} />
    </Svg>
  );
}

export { SquareArrowLeftIcon };
export type { SquareArrowLeftIconHandle };
