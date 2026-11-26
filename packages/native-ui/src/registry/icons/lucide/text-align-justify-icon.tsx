// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link TextAlignJustifyIcon} through. */
type TextAlignJustifyIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where the right end of each line is at rest and at the far end of the way out: the web twin's. */
const MIDDLE = [21, 15];
const BOTTOM = [21, 18];

/**
 * Lucide's text-align-justify icon, whose middle and bottom lines shrink from the right, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function TextAlignJustifyIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const middle = useAnimatedProps(() => ({ d: `M3 12H${MIDDLE[0] + (MIDDLE[1] - MIDDLE[0]) * progress.value}` }));
  const bottom = useAnimatedProps(() => ({ d: `M3 19H${BOTTOM[0] + (BOTTOM[1] - BOTTOM[0]) * progress.value}` }));

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
      <Path d="M3 5h18" />
      <AnimatedPath d="M3 12h18" animatedProps={middle} />
      <AnimatedPath d="M3 19h18" animatedProps={bottom} />
    </Svg>
  );
}

export { TextAlignJustifyIcon };
export type { TextAlignJustifyIconHandle };
