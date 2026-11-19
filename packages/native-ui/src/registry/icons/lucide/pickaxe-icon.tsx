// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PickaxeIcon} through. */
type PickaxeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the pickaxe lifts back and strikes, in degrees about its bottom-left corner, and its size as it does: the
 * web twin's 20 and 25 would swing its head past the canvas, which react-native-svg clips, so it swings less and
 * shrinks towards the corner as it swings.
 */
const SWING = [0, -10, 10];
const SIZE = [1, 0.85, 0.85];

/**
 * Lucide's pickaxe icon, which lifts back and strikes, and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function PickaxeIcon({
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
      rotate: interpolate(progress.value, [0, 0.75, 1], SWING),
      scaleX: interpolate(progress.value, [0, 0.75, 1], SIZE),
      scaleY: interpolate(progress.value, [0, 0.75, 1], SIZE),
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
        <Path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" />
        <Path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024" />
        <Path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069" />
        <Path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z" />
      </AnimatedG>
    </Svg>
  );
}

export { PickaxeIcon };
export type { PickaxeIconHandle };
