// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ConciergeBellIcon} through. */
type ConciergeBellIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** How far the sound waves spread at most: less than the web twin's 1.3, which would take the left one past the canvas. */
const SPREAD = 1.1;

/**
 * Lucide's concierge-bell icon, whose button is pressed, so the bell rocks and its sound waves spread out and fade when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ConciergeBellIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const button = useAnimatedProps(() =>
    transformProps({ y: interpolate(progress.value, [0, 0.4], [0, 2], Extrapolation.CLAMP) }),
  );
  const bell = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0.2, 0.4, 0.6, 0.8, 1], [0, -2, 2, -2, 2], Extrapolation.CLAMP),
      originY: 16,
    }),
  );
  const waves = useAnimatedProps(() => {
    const p = progress.value;
    const scale = p > 0 ? interpolate(p, [0, 0.3, 1], [0.8, 1, SPREAD]) : 1;
    return {
      opacity: interpolate(p, [0, 0.3, 1], [0, 1, 0]),
      ...transformProps({ scaleX: scale, scaleY: scale, originX: 14, originY: 18 }),
    };
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
      <Path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z" />
      <AnimatedG animatedProps={bell}>
        <Path d="M20 16a8 8 0 1 0-16 0" />
        <AnimatedG animatedProps={button}>
          <Path d="M10 4h4" />
          <Path d="M12 4v4" />
        </AnimatedG>
      </AnimatedG>
      <AnimatedG animatedProps={waves}>
        <Path d="M2 13a7 7 0 0 1 1-3.5" opacity={0.7} strokeWidth={1.5} />
        <Path d="M21 13a7 7 0 0 0-1-3.5" opacity={0.7} strokeWidth={1.5} />
      </AnimatedG>
    </Svg>
  );
}

export { ConciergeBellIcon };
export type { ConciergeBellIconHandle };
