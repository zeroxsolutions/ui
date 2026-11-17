// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FeatherIcon} through. */
type FeatherIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The feather's turn, lift and sideways drift at the start, middle and end of the way out, in degrees and 24-unit
 * viewBox units. Each is about half the web twin's or less, which would take the feather past the canvas.
 */
const TURN = [0, -4, 2];
const LIFT = [0, -0.5, -0.25];
const DRIFT = [0, 0.5, -0.5];

/**
 * Lucide's feather icon, which drifts up a little and sways from side to side, and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function FeatherIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const feather = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.5, 1], TURN),
      x: interpolate(progress.value, [0, 0.5, 1], DRIFT),
      y: interpolate(progress.value, [0, 0.5, 1], LIFT),
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
      <AnimatedG animatedProps={feather}>
        <Path d="M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z" />
        <Path d="M16 8 2 22" />
        <Path d="M17.488 15H9" />
      </AnimatedG>
    </Svg>
  );
}

export { FeatherIcon };
export type { FeatherIconHandle };
