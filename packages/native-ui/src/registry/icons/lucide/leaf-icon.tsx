// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LeafIcon} through. */
type LeafIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where in the way out each step of the sway falls. */
const SWAY = [0, 0.25, 0.5, 0.75, 1];

/**
 * Lucide's leaf icon, which sways and tilts in the wind, then settles, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LeafIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // About a quarter of the web twin's sway (8 degrees, 4 up, 2 across), which takes the tip past the canvas, which
  // react-native-svg clips.
  const whole = useAnimatedProps(() => ({
    ...transformProps({
      rotate: interpolate(progress.value, SWAY, [0, -2, 1, -0.75, 0]),
      y: interpolate(progress.value, SWAY, [0, -0.5, -0.25, -0.1, 0]),
      x: interpolate(progress.value, SWAY, [0, 0.5, -0.5, 0.25, 0]),
    }),
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
        <Path d="M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20" />
        <Path d="M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13" />
      </AnimatedG>
    </Svg>
  );
}

export { LeafIcon };
export type { LeafIconHandle };
