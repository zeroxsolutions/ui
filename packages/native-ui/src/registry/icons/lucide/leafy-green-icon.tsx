// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LeafyGreenIcon} through. */
type LeafyGreenIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where in the way out each step of the sway falls. */
const SWAY = [0, 0.25, 0.5, 0.75, 1];

/**
 * Lucide's leafy-green icon, which sways and tilts in the wind, then settles when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function LeafyGreenIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // About a quarter of the web twin's sway (8 degrees, 4 up, 2 across), which takes the leaves past the canvas, which
  // react-native-svg clips.
  const whole = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, SWAY, [0, -2, 1, -0.75, 0]),
      y: interpolate(progress.value, SWAY, [0, -0.5, -0.25, -0.1, 0]),
      x: interpolate(progress.value, SWAY, [0, 0.5, -0.5, 0.25, 0]),
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
      <AnimatedG animatedProps={whole}>
        <Path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22" />
        <Path d="M2 22 17 7" />
      </AnimatedG>
    </Svg>
  );
}

export { LeafyGreenIcon };
export type { LeafyGreenIconHandle };
