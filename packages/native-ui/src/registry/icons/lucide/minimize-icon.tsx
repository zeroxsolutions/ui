// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MinimizeIcon} through. */
type MinimizeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far each corner moves in along each axis, in the 24-unit viewBox. */
const SHIFT = 2;

/**
 * Lucide's minimize icon, whose corners close in on the middle and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function MinimizeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const topLeft = useAnimatedProps(() => transformProps({ x: SHIFT * progress.value, y: SHIFT * progress.value }));
  const topRight = useAnimatedProps(() => transformProps({ x: -SHIFT * progress.value, y: SHIFT * progress.value }));
  const bottomLeft = useAnimatedProps(() => transformProps({ x: SHIFT * progress.value, y: -SHIFT * progress.value }));
  const bottomRight = useAnimatedProps(() =>
    transformProps({ x: -SHIFT * progress.value, y: -SHIFT * progress.value }),
  );

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
      <AnimatedPath d="M8 3v3a2 2 0 0 1-2 2H3" animatedProps={topLeft} />
      <AnimatedPath d="M21 8h-3a2 2 0 0 1-2-2V3" animatedProps={topRight} />
      <AnimatedPath d="M3 16h3a2 2 0 0 1 2 2v3" animatedProps={bottomLeft} />
      <AnimatedPath d="M16 21v-3a2 2 0 0 1 2-2h3" animatedProps={bottomRight} />
    </Svg>
  );
}

export { MinimizeIcon };
export type { MinimizeIconHandle };
