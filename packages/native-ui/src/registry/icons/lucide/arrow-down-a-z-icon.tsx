// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowDownAZIcon} through. */
type ArrowDownAZIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the two characters move to trade places, in the 24-unit viewBox. */
const SWAP = 10;

/**
 * Lucide's arrow-down-a-z icon, whose A and Z trade places and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ArrowDownAZIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const upper = useAnimatedProps(() => transformProps({ y: SWAP * progress.value }));
  const lower = useAnimatedProps(() => transformProps({ y: -SWAP * progress.value }));

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
      <Path d="m3 16 4 4 4-4" />
      <Path d="M7 20V4" />
      <AnimatedG animatedProps={upper}>
        <Path d="M20 8h-5" />
        <Path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10" />
      </AnimatedG>
      <AnimatedPath d="M15 14h5l-5 6h5" animatedProps={lower} />
    </Svg>
  );
}

export { ArrowDownAZIcon };
export type { ArrowDownAZIconHandle };
