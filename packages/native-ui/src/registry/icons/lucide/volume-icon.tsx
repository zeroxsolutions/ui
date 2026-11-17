// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link VolumeIcon} through. */
type VolumeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** When each wave fades in during the way out: the web twin's 0.1 s stagger and 0.3 s fade, in proportion. */
const NEAR = [0.2, 0.8];
const FAR = [0.4, 1];

/**
 * Lucide's volume icon, whose sound waves fade in one after another and out again when started. The waves are hidden at
 * rest. Hidden from a screen reader: the control around it says what it does.
 */
function VolumeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const near = useAnimatedProps(() => ({ opacity: interpolate(progress.value, NEAR, [0, 1], Extrapolation.CLAMP) }));
  const far = useAnimatedProps(() => ({ opacity: interpolate(progress.value, FAR, [0, 1], Extrapolation.CLAMP) }));

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
      <Path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <AnimatedPath d="M16 9a5 5 0 0 1 0 6" opacity={0} animatedProps={near} />
      <AnimatedPath d="M19.364 18.364a9 9 0 0 0 0-12.728" opacity={0} animatedProps={far} />
    </Svg>
  );
}

export { VolumeIcon };
export type { VolumeIconHandle };
