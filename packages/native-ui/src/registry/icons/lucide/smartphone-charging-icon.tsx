// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SmartphoneChargingIcon} through. */
type SmartphoneChargingIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How faint the bolt gets: the web twin's, once where the web twin repeats. */
const DIM = 0.4;

/**
 * Lucide's smartphone-charging icon, whose bolt dims and brightens again when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function SmartphoneChargingIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const bolt = useAnimatedProps(() => ({ opacity: 1 - (1 - DIM) * progress.value }));

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
      <Rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <AnimatedPath d="M12.667 8 10 12h4l-2.667 4" animatedProps={bolt} />
    </Svg>
  );
}

export { SmartphoneChargingIcon };
export type { SmartphoneChargingIconHandle };
