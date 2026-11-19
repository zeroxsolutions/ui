// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SquareChevronDownIcon} through. */
type SquareChevronDownIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the chevron nudges, in the 24-unit viewBox: the web twin's. */
const NUDGE = 2;

/**
 * Lucide's square-chevron-down icon, whose chevron nudges down and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function SquareChevronDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const chevron = useAnimatedProps(() => transformProps({ y: NUDGE * progress.value }));

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
      <AnimatedPath d="m16 10-4 4-4-4" animatedProps={chevron} />
    </Svg>
  );
}

export { SquareChevronDownIcon };
export type { SquareChevronDownIconHandle };
