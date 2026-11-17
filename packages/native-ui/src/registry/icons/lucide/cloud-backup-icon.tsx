// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudBackupIcon} through. */
type CloudBackupIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How much the arrow shrinks through the turn, as a fraction of its size: the web twin keeps it whole, and turned
 * whole it would sweep past the canvas, which react-native-svg clips.
 */
const SHRINK = 0.1;

/**
 * Lucide's cloud-backup icon, whose arrow turns a full turn backwards about its middle and unwinds when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function CloudBackupIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => {
    const scale = 1 - SHRINK * interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
    return transformProps({ rotate: -360 * progress.value, originY: 16, scaleX: scale, scaleY: scale });
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
      <Path d="M21 15.251A4.5 4.5 0 0 0 17.5 8h-1.79A7 7 0 1 0 3 13.607" />
      <AnimatedG animatedProps={arrow}>
        <Path d="M7 11v4h4" />
        <Path d="M8 19a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5 4.82 4.82 0 0 0-3.41 1.41L7 15" />
      </AnimatedG>
    </Svg>
  );
}

export { CloudBackupIcon };
export type { CloudBackupIconHandle };
