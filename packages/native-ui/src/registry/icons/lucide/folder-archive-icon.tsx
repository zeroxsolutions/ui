// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderArchiveIcon} through. */
type FolderArchiveIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's folder-archive icon, whose zip fades out and in again when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function FolderArchiveIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const zip = useAnimatedProps(() => ({ opacity: 1 - progress.value }));

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
      <Path d="M20.9 19.8A2 2 0 0 0 22 18V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h5.1" />
      <AnimatedG animatedProps={zip}>
        <Circle cx="15" cy="19" r="2" />
        <Path d="M15 11v-1" />
        <Path d="M15 17v-2" />
      </AnimatedG>
    </Svg>
  );
}

export { FolderArchiveIcon };
export type { FolderArchiveIconHandle };
