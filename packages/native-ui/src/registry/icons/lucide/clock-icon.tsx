// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ClockIcon} through. */
type ClockIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's clock icon, whose hands turn and return when started. The hands are two paths, so each can turn
 * by its own amount. Hidden from a screen reader: the control around it says what it does.
 */
function ClockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const hour = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value }));
  const minute = useAnimatedProps(() => transformProps({ rotate: 45 * progress.value }));

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
      <Circle cx="12" cy="12" r="10" />
      <AnimatedPath d="M12 6v6" animatedProps={hour} />
      <AnimatedPath d="M12 12l4 2" animatedProps={minute} />
    </Svg>
  );
}

export { ClockIcon };
export type { ClockIconHandle };
