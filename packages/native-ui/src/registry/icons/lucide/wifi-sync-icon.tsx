// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WifiSyncIcon} through. */
type WifiSyncIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the arrows turn, in degrees about their middle (16.965, 16.105), and their size there: the web twin's turn,
 * whose corners would sweep past the canvas, which react-native-svg clips, so they shrink, by the first tenth of the
 * way, before a corner points out.
 */
const TURN = -360;
const SIZE = 0.79;

/**
 * Lucide's wifi-sync icon, whose sync arrows turn a full turn backwards and return when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function WifiSyncIcon({
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
    const size = interpolate(progress.value, [0, 0.1, 1], [1, SIZE, SIZE]);
    return transformProps({
      rotate: TURN * progress.value,
      scaleX: size,
      scaleY: size,
      originX: 16.965,
      originY: 16.105,
    });
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
      <Path d="M2 8.82a15 15 0 0 1 20 0" />
      <Path d="M5 12.86a10 10 0 0 1 3-2.032" />
      <Path d="M8.5 16.429h.01" />
      <AnimatedG animatedProps={arrows}>
        <Path d="M11.965 10.105v4L13.5 12.5a5 5 0 0 1 8 1.5" />
        <Path d="M11.965 14.105h4" />
        <Path d="M17.965 18.105h4L20.43 19.71a5 5 0 0 1-8-1.5" />
        <Path d="M21.965 22.105v-4" />
      </AnimatedG>
    </Svg>
  );
}

export { WifiSyncIcon };
export type { WifiSyncIconHandle };
