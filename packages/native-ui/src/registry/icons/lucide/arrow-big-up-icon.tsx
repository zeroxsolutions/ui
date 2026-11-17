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

/** The handle a control starts and stops {@link ArrowBigUpIcon} through. */
type ArrowBigUpIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Each way takes half of the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's arrow-big-up icon, which nudges up and back when started. Hidden from a screen reader: the control around
 * it says what it does.
 */
function ArrowBigUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const arrow = useAnimatedProps(() => transformProps({ y: -3 * progress.value }));

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
      <AnimatedPath
        d="M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z"
        animatedProps={arrow}
      />
    </Svg>
  );
}

export { ArrowBigUpIcon };
export type { ArrowBigUpIconHandle };
