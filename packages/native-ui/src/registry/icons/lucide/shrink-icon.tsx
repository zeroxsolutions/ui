// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShrinkIcon} through. */
type ShrinkIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far each corner moves in along each axis, in the 24-unit viewBox: the web twin's. */
const SHIFT = 1;

/**
 * Lucide's shrink icon, whose corners close in on the middle and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function ShrinkIcon({
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
      <AnimatedPath d="M9 4.2V9m0 0H4.2M9 9 3 3" animatedProps={topLeft} />
      <AnimatedPath d="M15 4.2V9m0 0h4.8M15 9l6-6" animatedProps={topRight} />
      <AnimatedPath d="M9 19.8V15m0 0H4.2M9 15l-6 6" animatedProps={bottomLeft} />
      <AnimatedPath d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" animatedProps={bottomRight} />
    </Svg>
  );
}

export { ShrinkIcon };
export type { ShrinkIconHandle };
