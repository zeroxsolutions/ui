// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BatteryPlusIcon} through. */
type BatteryPlusIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's battery-plus icon, whose plus dims, shrinks, then swells past its size, and returns, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function BatteryPlusIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const plus = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 0.8, 1.2]);
    return { opacity: 1 - 0.5 * progress.value, ...transformProps({ scaleX: scale, scaleY: scale, originX: 10 }) };
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
      <Path d="M12.543 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.605" />
      <Path d="M22 14v-4" />
      <Path d="M7.606 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.606" />
      <AnimatedG animatedProps={plus}>
        <Path d="M10 9v6" />
        <Path d="M7 12h6" />
      </AnimatedG>
    </Svg>
  );
}

export { BatteryPlusIcon };
export type { BatteryPlusIconHandle };
