// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MailboxIcon} through. */
type MailboxIconHandle = IconHandle;

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

/**
 * Lucide's mailbox icon, whose flag swings up about its foot and back down when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function MailboxIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const flag = useAnimatedProps(() => transformProps({ rotate: -90 * progress.value, originX: 18, originY: 11 }));

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
      <Path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
      <AnimatedPolyline points="15,9 18,9 18,11" animatedProps={flag} />
      <Path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />
      <Line x1="6" x2="7" y1="10" y2="10" />
    </Svg>
  );
}

export { MailboxIcon };
export type { MailboxIconHandle };
