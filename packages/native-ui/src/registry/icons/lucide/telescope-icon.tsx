// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TelescopeIcon} through. */
type TelescopeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** How far the tube tips, in degrees about the mount (12, 13): the web twin's. */
const TIP = -15;

/**
 * Lucide's telescope icon, whose tube tips up about its mount and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function TelescopeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const tube = useAnimatedProps(() => transformProps({ rotate: TIP * progress.value, originX: 12, originY: 13 }));

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
      <AnimatedG animatedProps={tube}>
        <Path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44" />
        <Path d="m13.56 11.747 4.332-.924" />
        <Path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z" />
        <Path d="m6.158 8.633 1.114 4.456" />
      </AnimatedG>
      <Path d="m16 21-3.105-6.21" />
      <Path d="m8 21 3.105-6.21" />
      <Circle cx="12" cy="13" r="2" />
    </Svg>
  );
}

export { TelescopeIcon };
export type { TelescopeIconHandle };
