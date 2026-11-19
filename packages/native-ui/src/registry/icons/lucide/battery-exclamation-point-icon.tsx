// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BatteryExclamationPointIcon} through. */
type BatteryExclamationPointIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's battery-exclamation-point icon, whose exclamation point swells and dims, then returns, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function BatteryExclamationPointIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const mark = useAnimatedProps(() => {
    const scale = 1 + 0.1 * progress.value;
    return { opacity: 1 - 0.6 * progress.value, ...transformProps({ scaleX: scale, scaleY: scale, originX: 10 }) };
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
      <Path d="M14 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
      <Path d="M22 14v-4" />
      <Path d="M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
      <AnimatedG animatedProps={mark}>
        <Path d="M10 16h.01" />
        <Path d="M10 8v4" />
      </AnimatedG>
    </Svg>
  );
}

export { BatteryExclamationPointIcon };
export type { BatteryExclamationPointIconHandle };
