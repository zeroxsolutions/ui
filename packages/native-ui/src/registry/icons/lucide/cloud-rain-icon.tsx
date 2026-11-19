// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudRainIcon} through. */
type CloudRainIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of a drop that dims over its own stretch of the motion, beginning at `start`. */
function streak(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + 0.6], [1, 0.2], Extrapolation.CLAMP) };
}

/**
 * Lucide's cloud-rain icon, whose drops dim one after another and brighten again when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function CloudRainIcon({
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
      <AnimatedPath d="M16 14v6" animatedProps={streak0} />
      <AnimatedPath d="M8 14v6" animatedProps={streak1} />
      <AnimatedPath d="M12 16v6" animatedProps={streak2} />
    </Svg>
  );
}

export { CloudRainIcon };
export type { CloudRainIconHandle };
