// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SearchIcon} through. */
type SearchIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where in the way out each step of the look falls. */
const LOOK = [0, 1 / 3, 2 / 3, 1];

/**
 * Lucide's search icon, which lifts and dips as if looking about, then settles, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function SearchIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => ({
    ...transformProps({
      x: interpolate(progress.value, LOOK, [0, 0, -3, 0]),
      y: interpolate(progress.value, LOOK, [0, -4, 0, 0]),
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
        <Path d="m21 21-4.34-4.34" />
        <Circle cx="11" cy="11" r="8" />
      </AnimatedG>
    </Svg>
  );
}

export { SearchIcon };
export type { SearchIconHandle };
