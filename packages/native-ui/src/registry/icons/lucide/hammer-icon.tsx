// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HammerIcon} through. */
type HammerIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the hammer lifts back and strikes, in degrees about its bottom-left corner: far less than the web twin's 20
 * and 25, which would swing its head past the canvas, which react-native-svg clips.
 */
const LIFT = -4;
const STRIKE = 4;

/**
 * Lucide's hammer icon, which lifts back and strikes, and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function HammerIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.75, 1], [0, LIFT, STRIKE]),
      originX: 0,
      originY: 24,
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
        <Path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />
        <Path d="m18 15 4-4" />
        <Path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
      </AnimatedG>
    </Svg>
  );
}

export { HammerIcon };
export type { HammerIconHandle };
