// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TextAlignCenterIcon} through. */
type TextAlignCenterIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the middle line is at each half of the way out: the web twin's first keyframes. */
const SHAKE = [0, 3, -3];

/**
 * Lucide's text-align-center icon, whose middle line shakes from side to side when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function TextAlignCenterIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const middle = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, [0, 0.5, 1], SHAKE) }));

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
      <Path d="M21 5H3" />
      <AnimatedPath d="M17 12H7" animatedProps={middle} />
      <Path d="M19 19H5" />
    </Svg>
  );
}

export { TextAlignCenterIcon };
export type { TextAlignCenterIconHandle };
