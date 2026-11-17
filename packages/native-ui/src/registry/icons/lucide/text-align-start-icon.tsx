// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TextAlignStartIcon} through. */
type TextAlignStartIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the right end of each line is at rest and at the far end of the way out: the web twin's. */
const MIDDLE = [15, 19];
const BOTTOM = [17, 12];

/**
 * Lucide's text-align-start icon, whose middle line grows and bottom line shrinks from the right, and back when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function TextAlignStartIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const middle = useAnimatedProps(() => ({ d: `M${MIDDLE[0] + (MIDDLE[1] - MIDDLE[0]) * progress.value} 12H3` }));
  const bottom = useAnimatedProps(() => ({ d: `M${BOTTOM[0] + (BOTTOM[1] - BOTTOM[0]) * progress.value} 19H3` }));

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
      <AnimatedPath d="M15 12H3" animatedProps={middle} />
      <AnimatedPath d="M17 19H3" animatedProps={bottom} />
    </Svg>
  );
}

export { TextAlignStartIcon };
export type { TextAlignStartIconHandle };
