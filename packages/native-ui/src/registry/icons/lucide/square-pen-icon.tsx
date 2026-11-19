// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SquarePenIcon} through. */
type SquarePenIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Where the pen is at each half of the way out, and its size about its nib (8, 16): the web twin's keyframes, whose
 * second would take the pen's top past the canvas, which react-native-svg clips, so it shrinks a little there.
 */
const SCRIBBLE_X = [0, -1, 1.5];
const SCRIBBLE_Y = [0, 1.5, -1];
const SIZE = [1, 1, 0.95];

/**
 * Lucide's square-pen icon, whose pen scribbles down and to the left, then up and to the right, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function SquarePenIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // The web twin's half-degree wobble is left out: it cannot be seen.
  const pen = useAnimatedProps(() => {
    const size = interpolate(progress.value, [0, 0.5, 1], SIZE);
    return transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], SCRIBBLE_X),
      y: interpolate(progress.value, [0, 0.5, 1], SCRIBBLE_Y),
      scaleX: size,
      scaleY: size,
      originX: 8,
      originY: 16,
    });
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
      <Path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <AnimatedPath
        d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"
        animatedProps={pen}
      />
    </Svg>
  );
}

export { SquarePenIcon };
export type { SquarePenIconHandle };
