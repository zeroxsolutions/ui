// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PanelLeftCloseIcon} through. */
type PanelLeftCloseIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's panel-left-close icon, whose chevron nudges left and returns when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function PanelLeftCloseIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const chevron = useAnimatedProps(() => transformProps({ x: -1.5 * progress.value }));

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
      <Path d="M9 3v18" />
      <AnimatedPath d="m16 15-3-3 3-3" animatedProps={chevron} />
    </Svg>
  );
}

export { PanelLeftCloseIcon };
export type { PanelLeftCloseIconHandle };
