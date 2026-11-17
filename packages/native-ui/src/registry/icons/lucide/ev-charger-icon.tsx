// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link EvChargerIcon} through. */
type EvChargerIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's ev-charger icon, whose bolt dims and brightens again when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function EvChargerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bolt = useAnimatedProps(() => ({ opacity: 1 - 0.6 * progress.value }));

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
      <Path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" />
      <Path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" />
      <Path d="M2 21h13" />
      <Path d="M3 7h11" />
      <AnimatedPath d="m9 11-2 3h3l-2 3" animatedProps={bolt} />
    </Svg>
  );
}

export { EvChargerIcon };
export type { EvChargerIconHandle };
