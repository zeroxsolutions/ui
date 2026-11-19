// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderKeyIcon} through. */
type FolderKeyIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's folder-key icon, whose key turns in its lock and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function FolderKeyIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const key = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.5, 1], [0, -15, 8]),
      x: 0.5 * progress.value,
      originX: 19,
      originY: 18,
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
      <Path d="M13 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v1.36" />
      <AnimatedG animatedProps={key}>
        <Path d="M19 12v6" />
        <Path d="M19 14h2" />
        <Circle cx="19" cy="20" r="2" />
      </AnimatedG>
    </Svg>
  );
}

export { FolderKeyIcon };
export type { FolderKeyIconHandle };
