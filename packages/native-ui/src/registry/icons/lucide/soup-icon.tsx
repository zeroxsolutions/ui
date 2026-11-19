// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link SoupIcon} through. */
type SoupIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far each wisp of steam rises as it fades: the web twin's 3 would take it past the canvas, which
 * react-native-svg clips, so it rises by 2.
 */
const RISE = 2;

/** How far into the way out each wisp starts to rise after the one before it, and how long it takes. */
const STAGGER = 0.1;
const SPAN = 0.8;

/** The place and opacity of the wisp that starts to rise `start` of the way out. */
function wisp(progress: number, start: number): IconTransformProps & { opacity: number } {
  'worklet';
  const risen = interpolate(progress, [start, start + SPAN], [0, 1], Extrapolation.CLAMP);
  return { ...transformProps({ y: -RISE * risen }), opacity: 1 - risen };
}

/**
 * Lucide's soup icon, whose steam rises and fades, and comes back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function SoupIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const right = useAnimatedProps(() => wisp(progress.value, 0));
  const middle = useAnimatedProps(() => wisp(progress.value, STAGGER));
  const left = useAnimatedProps(() => wisp(progress.value, 2 * STAGGER));

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
      <Path d="M4 12a1 1 0 00-.99 1.133A9 9 0 0012 21a9 9 0 008.99-7.867A1 1 0 0020 12z" />
      <Path d="M7 21h10" />
      <Path d="M19.5 12 22 6" />
      <AnimatedPath
        d="M16.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.725 1.62"
        animatedProps={right}
      />
      <AnimatedPath
        d="M11.248 3c.273.1.808.53.747 1.36-.05.83-.938 1.2-.989 2.02-.06.78.333 1.24.727 1.62"
        animatedProps={middle}
      />
      <AnimatedPath
        d="M6.252 3c.268.1.794.53.745 1.36-.06.83-.923 1.2-.993 2.02-.05.78.338 1.24.735 1.62"
        animatedProps={left}
      />
    </Svg>
  );
}

export { SoupIcon };
export type { SoupIconHandle };
