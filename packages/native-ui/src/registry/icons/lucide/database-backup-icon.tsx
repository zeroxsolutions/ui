// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DatabaseBackupIcon} through. */
type DatabaseBackupIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's database-backup icon, whose arrow turns a full turn about its middle and unwinds when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function DatabaseBackupIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value, originX: 17.5, originY: 17 }));

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
      <Ellipse cx="12" cy="5" rx="9" ry="3" />
      <Path d="M3 12a9 3 0 0 0 5 2.69" />
      <Path d="M21 9.3V5" />
      <Path d="M3 5v14a9 3 0 0 0 6.47 2.88" />
      <AnimatedG animatedProps={arrow}>
        <Path d="M12 12v4h4" />
        <Path d="M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" />
      </AnimatedG>
    </Svg>
  );
}

export { DatabaseBackupIcon };
export type { DatabaseBackupIconHandle };
