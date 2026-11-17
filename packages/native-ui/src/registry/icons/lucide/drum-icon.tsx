// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DrumIcon} through. */
type DrumIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's drum icon, whose sticks swing about their middles and beat the drum, one just after the other when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function DrumIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const left = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.45, 0.9], [0, -10, 10], Extrapolation.CLAMP),
      originX: 6,
      originY: 6,
    }),
  );
  const right = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0.1, 0.55, 1], [0, 10, -10], Extrapolation.CLAMP),
      originX: 18,
      originY: 6,
    }),
  );

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
      <AnimatedPath d="m2 2 8 8" animatedProps={left} />
      <AnimatedPath d="m22 2-8 8" animatedProps={right} />
      <Ellipse cx="12" cy="9" rx="10" ry="5" />
      <Path d="M7 13.4v7.9" />
      <Path d="M12 14v8" />
      <Path d="M17 13.4v7.9" />
      <Path d="M2 9v8a10 5 0 0 0 20 0V9" />
    </Svg>
  );
}

export { DrumIcon };
export type { DrumIconHandle };
