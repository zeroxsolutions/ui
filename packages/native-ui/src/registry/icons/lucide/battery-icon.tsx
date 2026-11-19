// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BatteryIcon} through. */
type BatteryIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Lucide's battery icon, which fills with charge from the left and empties again when started. The charge is hidden
 * at rest. Hidden from a screen reader: the control around it says what it does.
 */
function BatteryIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const charge = useAnimatedProps(() => ({ width: 12 * progress.value, opacity: progress.value }));

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
      <Rect x="2" y="6" width="16" height="12" rx="2" />
      <Path d="M 22 14 L 22 10" />
      <AnimatedRect
        x="4"
        y="8"
        width={0}
        height="8"
        rx="1"
        fill={color}
        stroke="none"
        opacity={0}
        animatedProps={charge}
      />
    </Svg>
  );
}

export { BatteryIcon };
export type { BatteryIconHandle };
