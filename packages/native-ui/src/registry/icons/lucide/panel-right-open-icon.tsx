// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PanelRightOpenIcon} through. */
type PanelRightOpenIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the chevron nudges, in the 24-unit viewBox: the web twin's. */
const NUDGE = 1.5;

/**
 * Lucide's panel-right-open icon, whose chevron nudges left and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function PanelRightOpenIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const chevron = useAnimatedProps(() => transformProps({ x: -NUDGE * progress.value }));

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
      <Path d="M15 3v18" />
      <AnimatedPath d="m10 15-3-3 3-3" animatedProps={chevron} />
    </Svg>
  );
}

export { PanelRightOpenIcon };
export type { PanelRightOpenIconHandle };
