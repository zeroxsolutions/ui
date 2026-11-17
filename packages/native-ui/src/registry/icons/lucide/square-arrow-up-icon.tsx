// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SquareArrowUpIcon} through. */
type SquareArrowUpIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the head steps back and how long the shaft is at the far end of the way out: the web twin's. */
const STEP = 3;
const SHAFT = 8;
const SHAFT_LEFT = 5;

/**
 * Lucide's square-arrow-up icon, whose arrow pulls back down and springs out again when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function SquareArrowUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const head = useAnimatedProps(() => transformProps({ y: STEP * progress.value }));
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
      <AnimatedPath d="m16 12-4-4-4 4" animatedProps={head} />
      <AnimatedPath d="M12 16V8" animatedProps={shaft} />
    </Svg>
  );
}

export { SquareArrowUpIcon };
export type { SquareArrowUpIconHandle };
