// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BatteryChargingIcon} through. */
type BatteryChargingIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's battery-charging icon, whose bolt swells and dims, then returns, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function BatteryChargingIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bolt = useAnimatedProps(() => {
    const scale = 1 + 0.2 * progress.value;
    return { opacity: 1 - 0.2 * progress.value, ...transformProps({ scaleX: scale, scaleY: scale, originX: 10 }) };
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
      <Path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" />
      <Path d="M22 14v-4" />
      <Path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />
      <AnimatedPath d="m11 7-3 5h4l-3 5" animatedProps={bolt} />
    </Svg>
  );
}

export { BatteryChargingIcon };
export type { BatteryChargingIconHandle };
