// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LoaderPinwheelIcon} through. */
type LoaderPinwheelIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's loader-pinwheel icon, whose blades turn a full turn inside the ring and unwind when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function LoaderPinwheelIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const blades = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value, originX: 12, originY: 11.9 }));

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
      <AnimatedG animatedProps={blades}>
        <Path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
        <Path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
        <Path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
      </AnimatedG>
      <Circle cx="12" cy="12" r="10" />
    </Svg>
  );
}

export { LoaderPinwheelIcon };
export type { LoaderPinwheelIconHandle };
