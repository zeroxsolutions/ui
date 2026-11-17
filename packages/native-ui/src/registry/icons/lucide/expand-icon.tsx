// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ExpandIcon} through. */
type ExpandIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** How far each arrow moves along each axis, in the 24-unit viewBox. */
const SHIFT = 2;

/**
 * Lucide's expand icon, whose four arrows move out towards their corners and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function ExpandIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bottomRight = useAnimatedProps(() => transformProps({ x: SHIFT * progress.value, y: SHIFT * progress.value }));
  const bottomLeft = useAnimatedProps(() => transformProps({ x: -SHIFT * progress.value, y: SHIFT * progress.value }));
  const topRight = useAnimatedProps(() => transformProps({ x: SHIFT * progress.value, y: -SHIFT * progress.value }));
  const topLeft = useAnimatedProps(() => transformProps({ x: -SHIFT * progress.value, y: -SHIFT * progress.value }));

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
      <AnimatedG animatedProps={bottomRight}>
        <Path d="m15 15 6 6" />
        <Path d="M21 16v5h-5" />
      </AnimatedG>
      <AnimatedG animatedProps={bottomLeft}>
        <Path d="M3 16v5h5" />
        <Path d="m3 21 6-6" />
      </AnimatedG>
      <AnimatedG animatedProps={topRight}>
        <Path d="M21 8V3h-5" />
        <Path d="m15 9 6-6" />
      </AnimatedG>
      <AnimatedG animatedProps={topLeft}>
        <Path d="M3 8V3h5" />
        <Path d="M9 9 3 3" />
      </AnimatedG>
    </Svg>
  );
}

export { ExpandIcon };
export type { ExpandIconHandle };
