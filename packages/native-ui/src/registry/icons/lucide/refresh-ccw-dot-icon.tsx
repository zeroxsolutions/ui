// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RefreshCcwDotIcon} through. */
type RefreshCcwDotIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the arrows turn backwards, in degrees about the middle, and how small they get as they do: the web twin's 50,
 * which would sweep the arrowheads past the canvas, which react-native-svg clips, so they shrink a little as they turn.
 */
const TURN = -50;
const SIZE = 0.86;

/**
 * Lucide's refresh-ccw-dot icon, whose arrows turn back part of the way round its dot and return when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function RefreshCcwDotIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrows = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], [1, SIZE, SIZE]);
    return transformProps({ rotate: TURN * progress.value, scaleX: size, scaleY: size });
  });

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
      <AnimatedG animatedProps={arrows}>
        <Path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <Path d="M3 3v5h5" />
        <Path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <Path d="M16 16h5v5" />
      </AnimatedG>
      <Circle cx="12" cy="12" r="1" />
    </Svg>
  );
}

export { RefreshCcwDotIcon };
export type { RefreshCcwDotIconHandle };
