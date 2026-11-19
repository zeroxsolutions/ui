// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Line, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link Link2Icon} through. */
type Link2IconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where in the way out each step of the pull falls. */
const PULL = [0, 0.6, 1];

/**
 * Lucide's link-2 icon, whose links pull apart and snap back together when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function Link2Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, PULL, [0, -0.7, 0.3]) }));
  const right = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, PULL, [0, 0.7, -0.3]) }));

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
      {/* Lucide's bar, drawn as two halves so each moves with its own link. */}
      <AnimatedG animatedProps={left}>
        <Path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <Line x1="8" x2="12" y1="12" y2="12" />
      </AnimatedG>
      <AnimatedG animatedProps={right}>
        <Path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <Line x1="16" x2="12" y1="12" y2="12" />
      </AnimatedG>
    </Svg>
  );
}

export { Link2Icon };
export type { Link2IconHandle };
