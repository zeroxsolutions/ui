// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowBigDownDashIcon} through. */
type ArrowBigDownDashIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each way takes half of the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's arrow-big-down-dash icon, whose arrow nudges down and back with its dash following a third as far, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ArrowBigDownDashIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const stroke = useAnimatedProps(() => transformProps({ y: 1 * progress.value }));
  // Less than the web twin's 3, which takes the tip past the canvas, which react-native-svg clips.
  const arrow = useAnimatedProps(() => transformProps({ y: 2.4 * progress.value }));

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
      <AnimatedPath d="M9 4h6" animatedProps={stroke} />
      <AnimatedPath
        d="M14 8a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h3.293a.707.707 0 0 1 .5 1.207l-6.939 6.939a1.207 1.207 0 0 1-1.708 0l-6.94-6.94a.707.707 0 0 1 .5-1.206H8a1 1 0 0 0 1-1V9a1 1 0 0 1 1-1z"
        animatedProps={arrow}
      />
    </Svg>
  );
}

export { ArrowBigDownDashIcon };
export type { ArrowBigDownDashIconHandle };
