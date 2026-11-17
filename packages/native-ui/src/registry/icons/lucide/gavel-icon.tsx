// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GavelIcon} through. */
type GavelIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the gavel lifts back and strikes, in degrees about its bottom-left corner: far less than the web twin's 20
 * and 25, which would swing its head past the canvas, since Lucide's gavel rests within a unit of its top and right.
 */
const LIFT = -4;
const STRIKE = 4;

/**
 * Lucide's gavel icon, which lifts back and strikes, and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function GavelIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const gavel = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.75, 1], [0, LIFT, STRIKE]), originX: 0, originY: 24 }),
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
      <AnimatedG animatedProps={gavel}>
        <Path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381" />
        <Path d="m16 16 6-6" />
        <Path d="m21.5 10.5-8-8" />
        <Path d="m8 8 6-6" />
        <Path d="m8.5 7.5 8 8" />
      </AnimatedG>
    </Svg>
  );
}

export { GavelIcon };
export type { GavelIconHandle };
