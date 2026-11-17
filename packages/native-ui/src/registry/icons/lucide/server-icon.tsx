// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Line, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ServerIcon} through. */
type ServerIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** How far each half moves, in the 24-unit viewBox: the web twin's, which swaps them. */
const SWAP = 12;

/**
 * Lucide's server icon, whose two halves swap places and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function ServerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const top = useAnimatedProps(() => transformProps({ y: SWAP * progress.value }));
  const bottom = useAnimatedProps(() => transformProps({ y: -SWAP * progress.value }));

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
      <AnimatedG animatedProps={top}>
        <Rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <Line x1="6" x2="6.01" y1="6" y2="6" />
      </AnimatedG>
      <AnimatedG animatedProps={bottom}>
        <Rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <Line x1="6" x2="6.01" y1="18" y2="18" />
      </AnimatedG>
    </Svg>
  );
}

export { ServerIcon };
export type { ServerIconHandle };
