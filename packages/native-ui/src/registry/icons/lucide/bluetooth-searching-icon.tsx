// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BluetoothSearchingIcon} through. */
type BluetoothSearchingIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's bluetooth-searching icon, whose signal dot and then its arc shrink away and grow back, the dot first, while
 * the rune dims, when started. Hidden from a screen reader: the control around it says what it does.
 */
function BluetoothSearchingIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const rune = useAnimatedProps(() => ({ opacity: 1 - 0.2 * progress.value }));
  const arc = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 0.7], [1, 0], Extrapolation.CLAMP);
    return transformProps({ scaleX: scale, scaleY: scale, originX: 21.42, originY: 12 });
  });
  const dot = useAnimatedProps(() => {
    const scale = 1 - progress.value;
    return transformProps({ scaleX: scale, scaleY: scale, originX: 18 });
  });

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
      <AnimatedPath d="m7 7 10 10-5 5V2l5 5L7 17" animatedProps={rune} />
      <AnimatedPath d="M20.83 14.83a4 4 0 0 0 0-5.66" animatedProps={arc} />
      <AnimatedPath d="M18 12h.01" animatedProps={dot} />
    </Svg>
  );
}

export { BluetoothSearchingIcon };
export type { BluetoothSearchingIconHandle };
