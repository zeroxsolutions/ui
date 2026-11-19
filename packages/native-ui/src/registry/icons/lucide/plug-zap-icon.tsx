// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PlugZapIcon} through. */
type PlugZapIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the spark dims: the web twin's 0.4. */
const DIM = 0.4;

/**
 * Lucide's plug-zap icon, whose spark dims and lights again when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function PlugZapIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const spark = useAnimatedProps(() => ({ opacity: 1 - (1 - DIM) * progress.value }));

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
      <Path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
      <Path d="m2 22 3-3" />
      <Path d="M7.5 13.5 10 11" />
      <Path d="M10.5 16.5 13 14" />
      <AnimatedPath d="m18 3-4 4h6l-4 4" animatedProps={spark} />
    </Svg>
  );
}

export { PlugZapIcon };
export type { PlugZapIconHandle };
