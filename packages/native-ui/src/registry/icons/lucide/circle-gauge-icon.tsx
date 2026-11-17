// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CircleGaugeIcon} through. */
type CircleGaugeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's circle-gauge icon, which turns a fifth of a turn about its middle and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CircleGaugeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const gauge = useAnimatedProps(() => transformProps({ rotate: 72 * progress.value }));

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
      <AnimatedG animatedProps={gauge}>
        <Path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" />
        <Circle cx="12" cy="12" r="2" />
        <Path d="M13.4 10.6 19 5" />
      </AnimatedG>
    </Svg>
  );
}

export { CircleGaugeIcon };
export type { CircleGaugeIconHandle };
