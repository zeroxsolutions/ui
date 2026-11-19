// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LayoutGridIcon} through. */
type LayoutGridIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** How far each tile moves to reach the next one's place, in the 24-unit viewBox. */
const STEP = 11;

/**
 * Lucide's layout-grid icon, whose tiles each move into the next one round, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LayoutGridIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const topLeft = useAnimatedProps(() => transformProps({ x: STEP * progress.value }));
  const topRight = useAnimatedProps(() => transformProps({ y: STEP * progress.value }));
  const bottomRight = useAnimatedProps(() => transformProps({ x: -STEP * progress.value }));
  const bottomLeft = useAnimatedProps(() => transformProps({ y: -STEP * progress.value }));

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
      <AnimatedRect width="7" height="7" x="3" y="3" rx="1" animatedProps={topLeft} />
      <AnimatedRect width="7" height="7" x="14" y="3" rx="1" animatedProps={topRight} />
      <AnimatedRect width="7" height="7" x="14" y="14" rx="1" animatedProps={bottomRight} />
      <AnimatedRect width="7" height="7" x="3" y="14" rx="1" animatedProps={bottomLeft} />
    </Svg>
  );
}

export { LayoutGridIcon };
export type { LayoutGridIconHandle };
