// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WalletIcon} through. */
type WalletIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the wallet lifts and tilts about the middle, and its size there: the web twin lifts by 3, which would take
 * its top past the canvas, which react-native-svg clips, so it lifts by 2, shrinking a little. The tilt is the web
 * twin's.
 */
const LIFT = -2;
const TILT = -4;
const SIZE = 0.95;

/**
 * Lucide's wallet icon, which lifts and tilts back, and settles when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function WalletIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      y: LIFT * progress.value,
      rotate: TILT * progress.value,
      scaleX: 1 - (1 - SIZE) * progress.value,
      scaleY: 1 - (1 - SIZE) * progress.value,
    }),
  );

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
      <AnimatedG animatedProps={whole}>
        <Path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <Path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </AnimatedG>
    </Svg>
  );
}

export { WalletIcon };
export type { WalletIconHandle };
