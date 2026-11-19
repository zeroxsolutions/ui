// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link Maximize2Icon} through. */
type Maximize2IconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's maximize-2 icon, whose corners push out and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function Maximize2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const lower = useAnimatedProps(() => transformProps({ x: -2 * progress.value, y: 2 * progress.value }));
  const upper = useAnimatedProps(() => transformProps({ x: 2 * progress.value, y: -2 * progress.value }));

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
      <AnimatedG animatedProps={lower}>
        <Path d="m3 21 7-7" />
        <Path d="M9 21H3v-6" />
      </AnimatedG>
      <AnimatedG animatedProps={upper}>
        <Path d="M15 3h6v6" />
        <Path d="m21 3-7 7" />
      </AnimatedG>
    </Svg>
  );
}

export { Maximize2Icon };
export type { Maximize2IconHandle };
