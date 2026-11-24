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
        <Path d="M17 3.34A5 5 0 1112 12a5 5 0 10-5 8.66" />
        <Path d="M22 12a5 5 0 01-10 0 5 5 0 00-10 0" />
        <Path d="M7 3.34A5 5 0 1112 12a5 5 0 105 8.66" />
      </AnimatedG>
      <Circle cx="12" cy="12" r="10" />
    </Svg>
  );
}

export { LoaderPinwheelIcon };
export type { LoaderPinwheelIconHandle };
