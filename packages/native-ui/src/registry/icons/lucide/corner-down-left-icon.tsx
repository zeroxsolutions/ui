// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconHandle,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CornerDownLeftIcon} through. */
type CornerDownLeftIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** How long each way of the motion runs, in ms: half the web icon's. */
const TIMING: IconTiming = { duration: 225 };

/**
 * Lucide's corner-down-left icon, which stretches sideways and shifts left, then returns, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function CornerDownLeftIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const whole = useAnimatedProps(() => ({
    ...transformProps({ scaleX: 1 + 0.15 * progress.value, x: -2 * progress.value }),
  }));

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
      <AnimatedG animatedProps={whole}>
        <Path d="M20 4v7a4 4 0 0 1-4 4H4" />
        <Path d="m9 10-5 5 5 5" />
      </AnimatedG>
    </Svg>
  );
}

export { CornerDownLeftIcon };
export type { CornerDownLeftIconHandle };
