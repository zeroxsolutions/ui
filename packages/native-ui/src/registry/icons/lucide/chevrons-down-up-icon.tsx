// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChevronsDownUpIcon} through. */
type ChevronsDownUpIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's chevrons-down-up icon, whose two chevrons close in on each other and part again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ChevronsDownUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const first = useAnimatedProps(() => transformProps({ y: -2 * progress.value }));
  const second = useAnimatedProps(() => transformProps({ y: 2 * progress.value }));

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
      <AnimatedPath d="m7 20 5-5 5 5" animatedProps={first} />
      <AnimatedPath d="m7 4 5 5 5-5" animatedProps={second} />
    </Svg>
  );
}

export { ChevronsDownUpIcon };
export type { ChevronsDownUpIconHandle };
