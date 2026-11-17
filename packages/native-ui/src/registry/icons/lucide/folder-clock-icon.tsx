// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderClockIcon} through. */
type FolderClockIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's folder-clock icon, whose hour hand turns a full turn and minute hand an eighth of one about their shared
 * end, and back when started. Hidden from a screen reader: the control around it says what it does.
 */
function FolderClockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const hour = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value, originX: 16, originY: 16.2 }));
  const minute = useAnimatedProps(() => transformProps({ rotate: 45 * progress.value, originX: 16, originY: 16.2 }));

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
      <Path d="M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2" />
      <Circle cx="16" cy="16" r="6" />
      <AnimatedPath d="M16 14v2.2" animatedProps={hour} />
      <AnimatedPath d="m16 16.2 1.6 1" animatedProps={minute} />
    </Svg>
  );
}

export { FolderClockIcon };
export type { FolderClockIconHandle };
