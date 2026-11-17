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

/** The handle a control starts and stops {@link ArrowBigRightDashIcon} through. */
type ArrowBigRightDashIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each way takes half of the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's arrow-big-right-dash icon, whose arrow nudges right and back with its dash following a third as far, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ArrowBigRightDashIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const stroke = useAnimatedProps(() => transformProps({ x: 1 * progress.value }));
  const arrow = useAnimatedProps(() => transformProps({ x: 3 * progress.value }));

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
      <AnimatedPath d="M4 9v6" animatedProps={stroke} />
      <AnimatedPath
        d="M11 9a1 1 0 0 0 1-1V4.707a.707.707 0 0 1 1.207-.5l6.94 6.94a1.207 1.207 0 0 1 0 1.707l-6.94 6.94a.707.707 0 0 1-1.207-.5V16a1 1 0 0 0-1-1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"
        animatedProps={arrow}
      />
    </Svg>
  );
}

export { ArrowBigRightDashIcon };
export type { ArrowBigRightDashIconHandle };
