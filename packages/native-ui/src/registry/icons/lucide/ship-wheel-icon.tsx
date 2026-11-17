// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ShipWheelIcon} through. */
type ShipWheelIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's ship-wheel icon, which turns half a turn and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function ShipWheelIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      rotate: 180 * progress.value,
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
      <AnimatedG animatedProps={whole}>
        <Circle cx="12" cy="12" r="8" />
        <Path d="M12 2v7.5" />
        <Path d="m19 5-5.23 5.23" />
        <Path d="M22 12h-7.5" />
        <Path d="m19 19-5.23-5.23" />
        <Path d="M12 14.5V22" />
        <Path d="M10.23 13.77 5 19" />
        <Path d="M9.5 12H2" />
        <Path d="M10.23 10.23 5 5" />
        <Circle cx="12" cy="12" r="2.5" />
      </AnimatedG>
    </Svg>
  );
}

export { ShipWheelIcon };
export type { ShipWheelIconHandle };
