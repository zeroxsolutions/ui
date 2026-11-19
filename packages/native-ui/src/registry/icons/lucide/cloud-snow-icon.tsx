// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudSnowIcon} through. */
type CloudSnowIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The opacity of a snowflake that dims over its own stretch of the motion, beginning at `start`. */
function flake(progress: number, start: number): { opacity: number } {
  'worklet';
  return { opacity: interpolate(progress, [start, start + 0.5], [1, 0.3], Extrapolation.CLAMP) };
}

/**
 * Lucide's cloud-snow icon, whose snowflakes dim one after another and brighten again when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function CloudSnowIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const flake0 = useAnimatedProps(() => flake(progress.value, 0.0));
  const flake1 = useAnimatedProps(() => flake(progress.value, 0.1));
  const flake2 = useAnimatedProps(() => flake(progress.value, 0.2));
  const flake3 = useAnimatedProps(() => flake(progress.value, 0.3));
  const flake4 = useAnimatedProps(() => flake(progress.value, 0.4));
  const flake5 = useAnimatedProps(() => flake(progress.value, 0.5));

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
      <AnimatedPath d="M8 15h.01" animatedProps={flake0} />
      <AnimatedPath d="M8 19h.01" animatedProps={flake1} />
      <AnimatedPath d="M12 17h.01" animatedProps={flake2} />
      <AnimatedPath d="M12 21h.01" animatedProps={flake3} />
      <AnimatedPath d="M16 15h.01" animatedProps={flake4} />
      <AnimatedPath d="M16 19h.01" animatedProps={flake5} />
    </Svg>
  );
}

export { CloudSnowIcon };
export type { CloudSnowIconHandle };
