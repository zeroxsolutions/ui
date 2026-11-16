// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link MenuIcon} through. */
type MenuIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's menu icon, whose outer bars cross into an X while the middle one fades, and return, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function MenuIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const top = useAnimatedProps(() => ({
    ...transformProps({ y: 7 * progress.value, rotate: 45 * progress.value, originY: 5 }),
  }));
  const middle = useAnimatedProps(() => ({ opacity: 1 - progress.value }));
  const bottom = useAnimatedProps(() => ({
    ...transformProps({ y: -7 * progress.value, rotate: -45 * progress.value, originY: 19 }),
  }));

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
      <AnimatedPath d="M4 5h16" animatedProps={top} />
      <AnimatedPath d="M4 12h16" animatedProps={middle} />
      <AnimatedPath d="M4 19h16" animatedProps={bottom} />
    </Svg>
  );
}

export { MenuIcon };
export type { MenuIconHandle };
