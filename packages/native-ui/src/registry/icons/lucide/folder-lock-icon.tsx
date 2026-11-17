// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderLockIcon} through. */
type FolderLockIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's folder-lock icon, whose lock lifts and rocks, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function FolderLockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const lock = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.6, 1], [0, -3, 2]),
      y: -1.6 * progress.value,
      originX: 18,
      originY: 19,
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
      <Path d="M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5" />
      <AnimatedG animatedProps={lock}>
        <Rect width="8" height="5" x="14" y="17" rx="1" />
        <Path d="M20 17v-2a2 2 0 1 0-4 0v2" />
      </AnimatedG>
    </Svg>
  );
}

export { FolderLockIcon };
export type { FolderLockIconHandle };
