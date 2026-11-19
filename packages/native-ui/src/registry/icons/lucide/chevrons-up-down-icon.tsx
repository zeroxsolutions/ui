// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChevronsUpDownIcon} through. */
type ChevronsUpDownIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's chevrons-up-down icon, whose chevrons part and return when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function ChevronsUpDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const lower = useAnimatedProps(() => transformProps({ y: 2 * progress.value }));
  const upper = useAnimatedProps(() => transformProps({ y: -2 * progress.value }));

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
      <AnimatedPath d="m7 15 5 5 5-5" animatedProps={lower} />
      <AnimatedPath d="m7 9 5-5 5 5" animatedProps={upper} />
    </Svg>
  );
}

export { ChevronsUpDownIcon };
export type { ChevronsUpDownIconHandle };
