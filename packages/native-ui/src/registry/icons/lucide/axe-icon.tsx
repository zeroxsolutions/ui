// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AxeIcon} through. */
type AxeIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * How far the axe lifts back and strikes, in degrees about its bottom-left corner, and its size as it does: the web
 * twin's 20 and 25 would swing its head past the canvas, which react-native-svg clips, so it swings less and shrinks
 * towards the corner as it swings, as the pickaxe does.
 */
const SWING = [0, -10, 10];
const SIZE = [1, 0.85, 0.85];

/**
 * Lucide's axe icon, which swings back, then forward past rest, and back, about its lower-left corner, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function AxeIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const axe = useAnimatedProps(() =>
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
      <AnimatedG animatedProps={axe}>
        <Path d="m14 12-8.381 8.38a1 1 0 0 1-3.001-3L11 9" />
        <Path d="M15 15.5a.5.5 0 0 0 .5.5A6.5 6.5 0 0 0 22 9.5a.5.5 0 0 0-.5-.5h-1.672a2 2 0 0 1-1.414-.586l-5.062-5.062a1.205 1.205 0 0 0-1.704 0L9.352 5.648a1.205 1.205 0 0 0 0 1.704l5.062 5.062A2 2 0 0 1 15 13.828z" />
      </AnimatedG>
    </Svg>
  );
}

export { AxeIcon };
export type { AxeIconHandle };
