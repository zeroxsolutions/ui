// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GaugeIcon} through. */
type GaugeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's gauge icon, whose needle swings across the dial and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function GaugeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const needle = useAnimatedProps(() =>
    transformProps({
      x: 0.5 * progress.value,
      y: 3 * progress.value,
      rotate: 72 * progress.value,
      originX: 14,
      originY: 12,
    }),
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
      <AnimatedPath d="m12 14 4-4" animatedProps={needle} />
      <Path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </Svg>
  );
}

export { GaugeIcon };
export type { GaugeIconHandle };
