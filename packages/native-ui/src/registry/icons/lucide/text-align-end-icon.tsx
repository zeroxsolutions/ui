// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TextAlignEndIcon} through. */
type TextAlignEndIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the left end of each line is at rest and at the far end of the way out: the web twin's. */
const MIDDLE = [9, 5];
const BOTTOM = [7, 12];

/**
 * Lucide's text-align-end icon, whose middle line grows and bottom line shrinks from the left, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function TextAlignEndIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const middle = useAnimatedProps(() => ({ d: `M21 12H${MIDDLE[0] + (MIDDLE[1] - MIDDLE[0]) * progress.value}` }));
  const bottom = useAnimatedProps(() => ({ d: `M21 19H${BOTTOM[0] + (BOTTOM[1] - BOTTOM[0]) * progress.value}` }));

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
      <AnimatedPath d="M21 12H9" animatedProps={middle} />
      <AnimatedPath d="M21 19H7" animatedProps={bottom} />
    </Svg>
  );
}

export { TextAlignEndIcon };
export type { TextAlignEndIconHandle };
