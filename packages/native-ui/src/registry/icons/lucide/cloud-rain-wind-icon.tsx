// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudRainWindIcon} through. */
type CloudRainWindIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of a streak that dims over its own stretch of the motion, beginning at `start`. */
function streak(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + 0.6], [1, 0.2], Extrapolation.CLAMP) };
}

/**
 * Lucide's cloud-rain-wind icon, whose streaks dim one after another and brighten again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CloudRainWindIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const streak0 = useAnimatedProps(() => streak(progress.value, 0.0));
  const streak1 = useAnimatedProps(() => streak(progress.value, 0.2));
  const streak2 = useAnimatedProps(() => streak(progress.value, 0.4));

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
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <AnimatedPath d="m9.2 22 3-7" animatedProps={streak0} />
      <AnimatedPath d="m9 13-3 7" animatedProps={streak1} />
      <AnimatedPath d="m17 13-3 7" animatedProps={streak2} />
    </Svg>
  );
}

export { CloudRainWindIcon };
export type { CloudRainWindIconHandle };
