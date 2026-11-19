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

/** The handle a control starts and stops {@link TornadoIcon} through. */
type TornadoIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far into the way out each line starts to swing after the one above it, and how long its swing takes. Each
 * swings as many units as its place from the top, as the web twin's do.
 */
const STAGGER = 0.1;
const SWING = 0.6;

/** The swing of the line `index` from the top at `progress`. */
function swing(progress: number, index: number): IconTransformProps {
  'worklet';
  const start = STAGGER * index;
  return transformProps({
    x: (index + 1) * interpolate(progress, [start, start + SWING], [0, 1], Extrapolation.CLAMP),
  });
}

/**
 * Lucide's tornado icon, whose lines swing to the right one after another, each further than the one above, and back
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function TornadoIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const line0 = useAnimatedProps(() => swing(progress.value, 0));
  const line1 = useAnimatedProps(() => swing(progress.value, 1));
  const line2 = useAnimatedProps(() => swing(progress.value, 2));
  const line3 = useAnimatedProps(() => swing(progress.value, 3));
  const line4 = useAnimatedProps(() => swing(progress.value, 4));

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
      <AnimatedPath d="M21 4H3" animatedProps={line0} />
      <AnimatedPath d="M18 8H6" animatedProps={line1} />
      <AnimatedPath d="M19 12H9" animatedProps={line2} />
      <AnimatedPath d="M16 16h-6" animatedProps={line3} />
      <AnimatedPath d="M11 20H9" animatedProps={line4} />
    </Svg>
  );
}

export { TornadoIcon };
export type { TornadoIconHandle };
