// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PlayIcon} through. */
type PlayIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Where in the way out each step falls: back and tilted, then forward. */
const STEPS = [0, 0.4, 1];

/** Where the triangle is at each step, in the 24-unit viewBox, and its tilt in degrees about its middle: the web twin's. */
const SHIFT = [0, -1, 2];
const TILT = [0, -10, 0];

/**
 * Lucide's play icon, which rears back, tilting, then springs forward, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function PlayIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const triangle = useAnimatedProps(() =>
    transformProps({
      x: interpolate(progress.value, STEPS, SHIFT),
      rotate: interpolate(progress.value, STEPS, TILT),
      originX: 13,
      originY: 12,
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
      <AnimatedPath
        d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"
        animatedProps={triangle}
      />
    </Svg>
  );
}

export { PlayIcon };
export type { PlayIconHandle };
