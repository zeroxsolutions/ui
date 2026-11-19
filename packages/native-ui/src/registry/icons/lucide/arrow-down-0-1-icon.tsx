// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowDown01Icon} through. */
type ArrowDown01IconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How far the two characters move to trade places, in the 24-unit viewBox. */
const SWAP = 10;

/**
 * Lucide's arrow-down-0-1 icon, whose 0 and 1 trade places and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ArrowDown01Icon({
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
      <AnimatedRect x="15" y="4" width="4" height="6" ry="2" animatedProps={upper} />
      <AnimatedG animatedProps={lower}>
        <Path d="M17 20v-6h-2" />
        <Path d="M15 20h4" />
      </AnimatedG>
    </Svg>
  );
}

export { ArrowDown01Icon };
export type { ArrowDown01IconHandle };
