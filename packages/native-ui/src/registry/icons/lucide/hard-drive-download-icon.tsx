// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HardDriveDownloadIcon} through. */
type HardDriveDownloadIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's hard-drive-download icon, whose arrow drops a unit into the drive and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function HardDriveDownloadIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => transformProps({ y: progress.value }));

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
      <Rect width="20" height="8" x="2" y="14" rx="2" />
      <Path d="M6 18h.01" />
      <Path d="M10 18h.01" />
      <AnimatedG animatedProps={arrow}>
        <Path d="M12 2v8" />
        <Path d="m16 6-4 4-4-4" />
      </AnimatedG>
    </Svg>
  );
}

export { HardDriveDownloadIcon };
export type { HardDriveDownloadIconHandle };
