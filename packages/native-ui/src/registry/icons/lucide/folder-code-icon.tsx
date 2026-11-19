// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderCodeIcon} through. */
type FolderCodeIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's folder-code icon, whose brackets lean apart and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function FolderCodeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() =>
    transformProps({ x: -2 * progress.value, rotate: 8 * progress.value, originX: 9, originY: 13 }),
  );
  const right = useAnimatedProps(() =>
    transformProps({ x: 2 * progress.value, rotate: -8 * progress.value, originX: 15, originY: 13 }),
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
      <Path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
      <AnimatedPath d="M10 10.5 8 13l2 2.5" animatedProps={left} />
      <AnimatedPath d="m14 10.5 2 2.5-2 2.5" animatedProps={right} />
    </Svg>
  );
}

export { FolderCodeIcon };
export type { FolderCodeIconHandle };
